// 自动遭遇战业务能力：唯一入口 runEncounterAutomation(event)。
import { g } from "../state/store.js";
import { post } from "../dom/http.js";
import { goto, openUrl } from "../core/navigate.js";
import { time } from "../core/time.js";
import { readStaminaValue } from "../state/stamina.js";
import {
  loadEncounterKey,
  markRandomEncounterStarted,
  msUntilReady,
  readCurrentReState,
} from "./encounter-state.js";

const MIDNIGHT_TRIGGER_DELAY_MS = 5000;
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

function msUntilNextUtcMidnight(now = new Date()) {
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return nextMidnight - now.getTime();
}

function nextEncounterCheckDelayMs(now = new Date()) {
  const jitteredMinute = (60 * 1000 * (Math.random() * 10 + 95)) / 100;
  return Math.min(
    jitteredMinute,
    msUntilNextUtcMidnight(now) + MIDNIGHT_TRIGGER_DELAY_MS
  );
}

function scheduleNextLobbyTick(state = readCurrentReState()) {
  const dueDelay = msUntilReady(state) + MIDNIGHT_TRIGGER_DELAY_MS;
  setTimeout(
    () => runEncounterAutomation({ type: EVENT_LOBBY_TICK }),
    Math.min(nextEncounterCheckDelayMs(), dueDelay)
  );
}

function canEnterEncounter(state) {
  return state.key && !state.clear;
}

function enterEncounter(state) {
  if (!state.key) return;
  openUrl(`?s=Battle&ss=ba&encounter=${state.key}`);
}

async function runLobbyTick() {
  syncDateNow();
  let state = readCurrentReState();
  if (state.count >= 24) {
    scheduleNextLobbyTick(state);
    return;
  }
  if (canEnterEncounter(state)) {
    enterEncounter(state);
    return;
  }
  if (msUntilReady(state) > 0) {
    scheduleNextLobbyTick(state);
    return;
  }
  if (
    g("option").restoreStamina &&
    readStaminaValue() <= g("option").staminaLow
  ) {
    post(window.location.href, goto, "recover=stamina");
    return;
  }
  state = await loadEncounterKey();
  if (canEnterEncounter(state || {})) {
    enterEncounter(state);
    return;
  }
  scheduleNextLobbyTick(readCurrentReState());
}

export function runEncounterAutomation(event = { type: EVENT_LOBBY_TICK }) {
  if (event.type === EVENT_RANDOM_ENCOUNTER_STARTED) {
    markRandomEncounterStarted();
    return;
  }
  runLobbyTick();
}
