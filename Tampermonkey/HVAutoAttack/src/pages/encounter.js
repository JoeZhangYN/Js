// 自动遭遇战业务能力：唯一入口 runEncounterAutomation(event)。
import { g } from "../state/store.js";
import { post } from "../dom/http.js";
import { goto, openUrl } from "../core/navigate.js";
import { time } from "../core/time.js";
import { readStaminaValue } from "../state/stamina.js";
import {
  msUntilNextEncounterCheck,
  planEncounterActivation,
  readEncounterReadiness,
} from "./encounter-policy.js";
import {
  loadEncounterKey,
  markRandomEncounterStarted,
  readCurrentReState,
} from "./encounter-state.js";

const EVENT_LOBBY_TICK = "lobbyTick";
const EVENT_RANDOM_ENCOUNTER_STARTED = "randomEncounterStarted";

export const EncounterEvent = Object.freeze({
  LOBBY_TICK: EVENT_LOBBY_TICK,
  RANDOM_ENCOUNTER_STARTED: EVENT_RANDOM_ENCOUNTER_STARTED,
});

function syncDateNow() {
  const dateNow = time(2);
  if (g("dateNow") !== dateNow) g("dateNow", dateNow);
  return dateNow;
}

function continueLater(state = readCurrentReState()) {
  return {
    claimed: false,
    nextCheckMs: msUntilNextEncounterCheck(state),
  };
}

function claimLobby() {
  return { claimed: true, nextCheckMs: 0 };
}

function executeEncounterActivation(state) {
  const plan = planEncounterActivation(state);
  if (plan.action !== "enter") return false;
  openUrl(plan.href);
  return true;
}

async function runLobbyTick() {
  syncDateNow();
  let state = readCurrentReState();
  const readiness = readEncounterReadiness(state);
  if (readiness.dailyLimitReached) {
    return continueLater(state);
  }
  if (executeEncounterActivation(state)) {
    return claimLobby();
  }
  if (readiness.remainingMs > 0) {
    return continueLater(state);
  }
  if (g("option").restoreStamina && readStaminaValue() <= g("option").staminaLow) {
    post(window.location.href, goto, "recover=stamina");
    return claimLobby();
  }
  state = await loadEncounterKey();
  if (executeEncounterActivation(state || {})) {
    return claimLobby();
  }
  return continueLater(readCurrentReState());
}

export function runEncounterAutomation(event = { type: EVENT_LOBBY_TICK }) {
  if (event.type === EVENT_RANDOM_ENCOUNTER_STARTED) {
    markRandomEncounterStarted();
    return { claimed: false, nextCheckMs: 0 };
  }
  return runLobbyTick();
}
