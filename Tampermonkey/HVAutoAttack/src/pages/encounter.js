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

function scheduleNextLobbyTick(state = readCurrentReState()) {
  setTimeout(
    () => runEncounterAutomation({ type: EVENT_LOBBY_TICK }),
    msUntilNextEncounterCheck(state)
  );
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
    scheduleNextLobbyTick(state);
    return false;
  }
  if (executeEncounterActivation(state)) {
    return true;
  }
  if (readiness.remainingMs > 0) {
    scheduleNextLobbyTick(state);
    return false;
  }
  if (g("option").restoreStamina && readStaminaValue() <= g("option").staminaLow) {
    post(window.location.href, goto, "recover=stamina");
    return true;
  }
  state = await loadEncounterKey();
  if (executeEncounterActivation(state || {})) {
    return true;
  }
  scheduleNextLobbyTick(readCurrentReState());
  return false;
}

export function runEncounterAutomation(event = { type: EVENT_LOBBY_TICK }) {
  if (event.type === EVENT_RANDOM_ENCOUNTER_STARTED) {
    markRandomEncounterStarted();
    return false;
  }
  return runLobbyTick();
}
