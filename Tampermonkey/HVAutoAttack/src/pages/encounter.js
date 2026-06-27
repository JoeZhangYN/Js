// 自动遭遇战业务能力：唯一入口 runEncounterAutomation(event)。
import { g } from "../state/store.js";
import { post } from "../dom/http.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { DayRecordEvent, runDayRecordAutomation } from "../state/day-record.js";
import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import {
  EncounterLobbyScheduleEvent,
  runEncounterLobbySchedule,
} from "./encounter-lobby-schedule.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";
import { planEncounterWidgetEvent } from "./encounter-widget-policy.js";

const EVENT_LOBBY_TICK = "lobbyTick";
const EVENT_RANDOM_ENCOUNTER_STARTED = "randomEncounterStarted";
const EVENT_WIDGET_TICK = "widgetTick";
const EVENT_WIDGET_LINK_FOUND = "widgetLinkFound";
const EVENT_WIDGET_STARTED_ENCOUNTER = "widgetStartedEncounter";
const EVENT_WIDGET_RESET_DAY = "widgetResetDay";
const EVENT_WIDGET_CLICKED = "widgetClicked";
const EVENT_WIDGET_TIMER_ELAPSED = "widgetTimerElapsed";
const EVENT_WIDGET_NEWS_LOADED = "widgetNewsLoaded";

export const EncounterEvent = Object.freeze({
  LOBBY_TICK: EVENT_LOBBY_TICK,
  RANDOM_ENCOUNTER_STARTED: EVENT_RANDOM_ENCOUNTER_STARTED,
  WIDGET_TICK: EVENT_WIDGET_TICK,
  WIDGET_LINK_FOUND: EVENT_WIDGET_LINK_FOUND,
  WIDGET_STARTED_ENCOUNTER: EVENT_WIDGET_STARTED_ENCOUNTER,
  WIDGET_RESET_DAY: EVENT_WIDGET_RESET_DAY,
  WIDGET_CLICKED: EVENT_WIDGET_CLICKED,
  WIDGET_TIMER_ELAPSED: EVENT_WIDGET_TIMER_ELAPSED,
  WIDGET_NEWS_LOADED: EVENT_WIDGET_NEWS_LOADED,
});

function reloadCurrentPage() {
  runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW });
}

function continueLater() {
  return { claimed: false };
}

function claimLobby() {
  runEncounterLobbySchedule({ type: EncounterLobbyScheduleEvent.CANCEL_NEXT_CHECK });
  return { claimed: true };
}

function scheduleNextLobbyTick(state, rerun) {
  runEncounterLobbySchedule({
    type: EncounterLobbyScheduleEvent.SCHEDULE_NEXT_CHECK,
    state,
    rerun,
  });
}

function waitForNextCheck(state, event) {
  scheduleNextLobbyTick(state, event.rerun);
  return continueLater();
}

function executeEncounterActivation(state) {
  const plan = runEncounterPolicy({
    type: EncounterPolicyEvent.PLAN_ACTIVATION,
    state,
  });
  if (plan.action !== "enter") return false;
  runNavigationAutomation({
    type: NavigationEvent.OPEN_URL,
    url: plan.href,
  });
  return true;
}

function executeWidgetNavigation(outcome) {
  if (outcome?.action === "navigate") {
    runNavigationAutomation({
      type: NavigationEvent.OPEN_URL,
      url: outcome.href,
    });
    return { ...outcome, action: "navigated", handled: true };
  }
  if (outcome?.action === "open") {
    runNavigationAutomation({
      type: NavigationEvent.OPEN_URL,
      url: outcome.href,
      newTab: true,
    });
    return { ...outcome, action: "opened", handled: true };
  }
  return outcome;
}

async function runLobbyTick(event) {
  runDayRecordAutomation({ type: DayRecordEvent.SYNC_UTC_DATE });
  let state = runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT });
  const readiness = runEncounterPolicy({
    type: EncounterPolicyEvent.READINESS,
    state,
  });
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
    return executeWidgetNavigation(planEncounterWidgetEvent(event));
  }
  return runLobbyTick(event);
}
