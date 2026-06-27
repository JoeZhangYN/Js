// 自动遭遇战业务能力：唯一入口 runEncounterAutomation(event)。
import { g } from "../state/store.js";
import { post } from "../dom/http.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { time } from "../core/time.js";
import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import {
  msUntilNextEncounterCheck,
  planEncounterActivation,
  readEncounterReadiness,
} from "./encounter-policy.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";
import { planEncounterWidgetEvent } from "./encounter-widget-policy.js";

const EVENT_LOBBY_TICK = "lobbyTick";
const EVENT_RANDOM_ENCOUNTER_STARTED = "randomEncounterStarted";
const EVENT_WIDGET_TICK = "widgetTick";
const EVENT_WIDGET_LINK_FOUND = "widgetLinkFound";
const EVENT_WIDGET_STARTED_ENCOUNTER = "widgetStartedEncounter";
const EVENT_WIDGET_RESET_DAY = "widgetResetDay";
const EVENT_WIDGET_CLICKED = "widgetClicked";
const EVENT_WIDGET_NEWS_LOADED = "widgetNewsLoaded";
const EVENT_WIDGET_ENGAGE = "widgetEngage";

let scheduledLobbyTick = null;

export const EncounterEvent = Object.freeze({
  LOBBY_TICK: EVENT_LOBBY_TICK,
  RANDOM_ENCOUNTER_STARTED: EVENT_RANDOM_ENCOUNTER_STARTED,
  WIDGET_TICK: EVENT_WIDGET_TICK,
  WIDGET_LINK_FOUND: EVENT_WIDGET_LINK_FOUND,
  WIDGET_STARTED_ENCOUNTER: EVENT_WIDGET_STARTED_ENCOUNTER,
  WIDGET_RESET_DAY: EVENT_WIDGET_RESET_DAY,
  WIDGET_CLICKED: EVENT_WIDGET_CLICKED,
  WIDGET_NEWS_LOADED: EVENT_WIDGET_NEWS_LOADED,
  WIDGET_ENGAGE: EVENT_WIDGET_ENGAGE,
});

function reloadCurrentPage() {
  runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW });
}

function syncDateNow() {
  const dateNow = time(2);
  if (g("dateNow") !== dateNow) g("dateNow", dateNow);
  return dateNow;
}

function continueLater() {
  return { claimed: false };
}

function claimLobby() {
  if (scheduledLobbyTick) clearTimeout(scheduledLobbyTick);
  scheduledLobbyTick = null;
  return { claimed: true };
}

function scheduleNextLobbyTick(state, rerun) {
  if (typeof rerun !== "function") return;
  const delayMs = msUntilNextEncounterCheck(state);
  if (!Number.isFinite(delayMs) || delayMs <= 0) return;
  if (scheduledLobbyTick) clearTimeout(scheduledLobbyTick);
  scheduledLobbyTick = setTimeout(() => {
    scheduledLobbyTick = null;
    rerun();
  }, delayMs);
}

function waitForNextCheck(state, event) {
  scheduleNextLobbyTick(state, event.rerun);
  return continueLater();
}

function executeEncounterActivation(state) {
  const plan = planEncounterActivation(state);
  if (plan.action !== "enter") return false;
  runNavigationAutomation({
    type: NavigationEvent.OPEN_URL,
    url: plan.href,
  });
  return true;
}

async function runLobbyTick(event) {
  syncDateNow();
  let state = runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT });
  const readiness = readEncounterReadiness(state);
  if (readiness.dailyLimitReached) {
    return waitForNextCheck(state, event);
  }
  if (executeEncounterActivation(state)) {
    return claimLobby();
  }
  if (readiness.remainingMs > 0) {
    return waitForNextCheck(state, event);
  }
  if (runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_BATTLE })) {
    post(window.location.href, reloadCurrentPage, "recover=stamina");
    return claimLobby();
  }
  state = await runEncounterStateAutomation({ type: EncounterStateEvent.LOAD_KEY });
  if (executeEncounterActivation(state || {})) {
    return claimLobby();
  }
  return waitForNextCheck(
    runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT }),
    event
  );
}

export function runEncounterAutomation(event = { type: EVENT_LOBBY_TICK }) {
  if (event.type === EVENT_RANDOM_ENCOUNTER_STARTED) {
    runEncounterStateAutomation({
      type: EncounterStateEvent.MARK_STARTED,
      search: event.search,
    });
    return { claimed: false };
  }
  if (event.type?.startsWith("widget")) {
    return planEncounterWidgetEvent(event);
  }
  return runLobbyTick(event);
}
