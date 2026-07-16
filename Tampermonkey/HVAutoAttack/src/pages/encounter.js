import { executeEncounterEntry } from "./encounter-entry-execution.js";
import { EncounterCheckMode } from "./encounter-check-mode.js";
import { EncounterGenerationApplication } from "./encounter-generation-application.js";
import {
  completeRandomEncounter,
  recognizeRandomEncounterStarted,
} from "./encounter-battle-lifecycle.js";
import { showEncounterGenerationBlock } from "./encounter-generation-block.js";
import {
  classifyEncounterGenerationResult,
  EncounterGenerationFailureReason,
  isBlockingEncounterGenerationResult,
} from "./encounter-generation-result.js";
import { runEncounterLobbyFlow } from "./encounter-lobby-flow.js";
import { rejectUnknownEncounterEvent } from "./encounter-rejection.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";
import { planEncounterWidgetEvent } from "./encounter-widget-policy.js";

const EVENT_LOBBY_TICK = "lobbyTick";
const EVENT_BATTLE_SESSION_STARTED = "battleSessionStarted";
const EVENT_BATTLE_SESSION_TERMINAL = "battleSessionTerminal";
const EVENT_GENERATION_PAGE_READY = "generationPageReady";
const EVENT_WIDGET_TICK = "widgetTick";
const EVENT_WIDGET_LINK_FOUND = "widgetLinkFound";
const EVENT_WIDGET_RESET_DAY = "widgetResetDay";
const EVENT_WIDGET_CLICKED = "widgetClicked";
const EVENT_WIDGET_NEWS_LOADED = "widgetNewsLoaded";
const EVENT_WIDGET_GENERATION_FAILED = "widgetGenerationFailed";

export const EncounterEvent = Object.freeze({
  LOBBY_TICK: EVENT_LOBBY_TICK,
  BATTLE_SESSION_STARTED: EVENT_BATTLE_SESSION_STARTED,
  BATTLE_SESSION_TERMINAL: EVENT_BATTLE_SESSION_TERMINAL,
  GENERATION_PAGE_READY: EVENT_GENERATION_PAGE_READY,
  WIDGET_TICK: EVENT_WIDGET_TICK,
  WIDGET_LINK_FOUND: EVENT_WIDGET_LINK_FOUND,
  WIDGET_RESET_DAY: EVENT_WIDGET_RESET_DAY,
  WIDGET_CLICKED: EVENT_WIDGET_CLICKED,
  WIDGET_NEWS_LOADED: EVENT_WIDGET_NEWS_LOADED,
  WIDGET_GENERATION_FAILED: EVENT_WIDGET_GENERATION_FAILED,
});

export { EncounterLobbyStatus } from "./encounter-lobby-outcome.js";

function executeWidgetEvent(event) {
  let authoritativeEvent = event;
  if (event.state === undefined) {
    const snapshot = runEncounterStateAutomation({ type: EncounterStateEvent.READ_SNAPSHOT });
    if (!snapshot?.ok) {
      return {
        action: "stateReadFailed",
        blocked: true,
        reason: "encounterStateReadFailed",
        state: snapshot?.state,
        persistence: snapshot,
      };
    }
    authoritativeEvent = { ...event, state: snapshot.state };
  }
  const outcome = executeEncounterEntry(planEncounterWidgetEvent(authoritativeEvent));
  if (!outcome?.blocked) return outcome;
  return {
    ...outcome,
    ...showEncounterGenerationBlock(
      {
        status: "persistenceFailed",
        reason: outcome.reason,
        state: outcome.state,
        persistence: outcome.persistence || outcome.rollback?.persistence,
        blocked: true,
      },
      "widgetEntry"
    ),
    state: outcome.state,
  };
}

function handleGenerationPageReady(event) {
  const generation = runEncounterStateAutomation({
    type: EncounterStateEvent.RECORD_GENERATION_RESULT,
    result: classifyEncounterGenerationResult(event),
    request: event.request,
    source: event.source,
    checkMode: EncounterCheckMode.AUTOMATIC,
    nowMs: event.nowMs,
  });
  return { ...showEncounterGenerationBlock(generation, event.source), generation };
}

function recordWidgetGeneration(event, result) {
  const source = {
    identity: "encounterWidget",
    pageKind: event.pageType === "eh" ? "ehentai" : event.pageType,
  };
  const generation = runEncounterStateAutomation({
    type: EncounterStateEvent.RECORD_GENERATION_RESULT,
    state: event.state,
    result,
    request: event.request,
    source,
    checkMode: event.checkMode || EncounterCheckMode.MANUAL,
    nowMs: event.nowMs,
  });
  if (!generation.blocked) {
    return {
      action:
        generation.application === EncounterGenerationApplication.AVAILABLE
          ? "ready"
          : "unavailable",
      handled: true,
      reason: generation.reason,
      state: generation.state,
      generation,
    };
  }
  return {
    ...showEncounterGenerationBlock(generation, source),
    state: generation.state,
    generation,
  };
}

function handleWidgetNewsLoaded(event) {
  const result = classifyEncounterGenerationResult(event);
  if (isBlockingEncounterGenerationResult(result)) {
    return recordWidgetGeneration(event, result);
  }
  return executeWidgetEvent(event);
}

function handleWidgetGenerationFailed(event) {
  return recordWidgetGeneration(
    event,
    classifyEncounterGenerationResult({
      transportFailure: {
        reason: event.reason || EncounterGenerationFailureReason.REQUEST_FAILED,
        detail: event.detail,
      },
    })
  );
}

const encounterEventHandlers = Object.freeze({
  [EVENT_LOBBY_TICK]: runEncounterLobbyFlow,
  [EVENT_BATTLE_SESSION_STARTED]: recognizeRandomEncounterStarted,
  [EVENT_BATTLE_SESSION_TERMINAL]: completeRandomEncounter,
  [EVENT_GENERATION_PAGE_READY]: handleGenerationPageReady,
  [EVENT_WIDGET_TICK]: executeWidgetEvent,
  [EVENT_WIDGET_LINK_FOUND]: executeWidgetEvent,
  [EVENT_WIDGET_RESET_DAY]: executeWidgetEvent,
  [EVENT_WIDGET_CLICKED]: executeWidgetEvent,
  [EVENT_WIDGET_NEWS_LOADED]: handleWidgetNewsLoaded,
  [EVENT_WIDGET_GENERATION_FAILED]: handleWidgetGenerationFailed,
});

export function runEncounterAutomation(event = { type: EVENT_LOBBY_TICK }) {
  const handler = encounterEventHandlers[event?.type];
  if (!handler) return rejectUnknownEncounterEvent(event);
  return handler(event);
}
