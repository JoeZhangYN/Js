// 自动遭遇战业务能力：唯一入口 runEncounterAutomation(event)。
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

function claimLobby() {
  runEncounterLobbySchedule({ type: EncounterLobbyScheduleEvent.CANCEL_NEXT_CHECK });
  return { claimed: true };
}

function waitForNextCheck(state, event) {
  runEncounterLobbySchedule({
    type: EncounterLobbyScheduleEvent.SCHEDULE_NEXT_CHECK,
    state,
    rerun: event.rerun,
  });
  return { claimed: false };
}

function executeEncounterEntry(outcome) {
  if (outcome?.action === "enter" || outcome?.action === "navigate") {
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

function planStoredEncounterEntry(state) {
  return runEncounterPolicy({
    type: EncounterPolicyEvent.PLAN_ACTIVATION,
    state,
  });
}

function enterStoredEncounter(state) {
  const outcome = executeEncounterEntry(planStoredEncounterEntry(state));
  if (!outcome?.handled) return undefined;
  return outcome;
}

function claimEnteredEncounter(outcome) {
  if (!outcome?.handled) return undefined;
  claimLobby();
  return { ...outcome, claimed: true };
}

function executeWidgetEvent(event) {
  return executeEncounterEntry(planEncounterWidgetEvent(event));
}

function postStaminaRecovery() {
  post(window.location.href, reloadCurrentPage, "recover=stamina");
}

async function loadAndEnterEncounter() {
  const state = await runEncounterStateAutomation({ type: EncounterStateEvent.LOAD_KEY });
  return enterStoredEncounter(state || {});
}

function syncDailyRecord() {
  runDayRecordAutomation({ type: DayRecordEvent.SYNC_UTC_DATE });
}

function readEncounterState() {
  return runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT });
}

function readStoredReadiness(state) {
  return runEncounterPolicy({
    type: EncounterPolicyEvent.READINESS,
    state,
  });
}

function shouldRestoreForBattle() {
  return runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_BATTLE });
}

function waitForCurrentState(event) {
  return waitForNextCheck(readEncounterState(), event);
}

function claimStaminaRecovery() {
  postStaminaRecovery();
  return claimLobby();
}

function claimEnteredStoredEncounter(state) {
  return claimEnteredEncounter(enterStoredEncounter(state));
}

function continueAfterLoadedEncounter(event) {
  return loadAndEnterEncounter().then(
    (outcome) => claimEnteredEncounter(outcome) || waitForCurrentState(event)
  );
}

function shouldWaitForClock(readiness) {
  return readiness.dailyLimitReached || readiness.remainingMs > 0;
}

async function runLobbyTick(event) {
  syncDailyRecord();
  const state = readEncounterState();
  const readiness = readStoredReadiness(state);
  if (shouldWaitForClock(readiness)) return waitForNextCheck(state, event);
  const entered = claimEnteredStoredEncounter(state);
  if (entered) return entered;
  if (shouldRestoreForBattle()) return claimStaminaRecovery();
  return continueAfterLoadedEncounter(event);
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
    return executeWidgetEvent(event);
  }
  return runLobbyTick(event);
}
