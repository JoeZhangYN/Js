// 自动遭遇战业务能力：唯一入口 runEncounterAutomation(event)。
import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { executeEncounterEntry } from "./encounter-entry-execution.js";
import {
  EncounterLobbyScheduleEvent,
  runEncounterLobbySchedule,
} from "./encounter-lobby-schedule.js";
import { isAutomaticEncounterEnabled } from "./encounter-option-gate.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { rejectUnknownEncounterEvent } from "./encounter-rejection.js";
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

async function loadAndEnterEncounter() {
  const state = await runEncounterStateAutomation({ type: EncounterStateEvent.LOAD_KEY });
  return enterStoredEncounter(state || {});
}

function readEncounterState() {
  return runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT });
}

function shouldRestoreForBattle() {
  return runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_BATTLE });
}

function claimStaminaRecovery() {
  runStaminaAutomation({ type: StaminaEvent.CLAIM_RECOVERY });
  return claimLobby();
}

function continueAfterLoadedEncounter(event) {
  return loadAndEnterEncounter().then(
    (outcome) => claimEnteredEncounter(outcome) || waitForNextCheck(readEncounterState(), event)
  );
}

async function runLobbyTick(event) {
  const state = readEncounterState();
  const clock = runEncounterPolicy({ type: EncounterPolicyEvent.READ_CLOCK, state });
  if (clock.status === "countdown") return waitForNextCheck(state, event);
  const entered = claimEnteredEncounter(enterStoredEncounter(state));
  if (entered) return entered;
  if (shouldRestoreForBattle()) return claimStaminaRecovery();
  return continueAfterLoadedEncounter(event);
}

function markRandomEncounterStarted(event) {
  if (!isAutomaticEncounterEnabled()) return { claimed: false, skipped: true };
  runEncounterStateAutomation({
    type: EncounterStateEvent.MARK_STARTED,
    search: event.search,
  });
  return { claimed: false };
}

const encounterEventHandlers = Object.freeze({
  [EVENT_LOBBY_TICK]: runLobbyTick,
  [EVENT_RANDOM_ENCOUNTER_STARTED]: markRandomEncounterStarted,
  [EVENT_WIDGET_TICK]: executeWidgetEvent,
  [EVENT_WIDGET_LINK_FOUND]: executeWidgetEvent,
  [EVENT_WIDGET_STARTED_ENCOUNTER]: executeWidgetEvent,
  [EVENT_WIDGET_RESET_DAY]: executeWidgetEvent,
  [EVENT_WIDGET_CLICKED]: executeWidgetEvent,
  [EVENT_WIDGET_TIMER_ELAPSED]: executeWidgetEvent,
  [EVENT_WIDGET_NEWS_LOADED]: executeWidgetEvent,
});

export function runEncounterAutomation(event = { type: EVENT_LOBBY_TICK }) {
  const handler = encounterEventHandlers[event?.type];
  if (!handler) {
    return rejectUnknownEncounterEvent(event);
  }
  return handler(event);
}
