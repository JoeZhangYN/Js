// 自动遭遇战业务能力：唯一入口 runEncounterAutomation(event)。
import { executeEncounterEntry } from "./encounter-entry-execution.js";
import { showEncounterGenerationBlock } from "./encounter-generation-block.js";
import {
  classifyEncounterGenerationResult,
  EncounterGenerationFailureReason,
  isBlockingEncounterGenerationResult,
} from "./encounter-generation-result.js";
import { runEncounterLobbyFlow } from "./encounter-lobby-flow.js";
import { isAutomaticEncounterEnabled } from "./encounter-option-gate.js";
import { rejectUnknownEncounterEvent } from "./encounter-rejection.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";
import { planEncounterWidgetEvent } from "./encounter-widget-policy.js";

const EVENT_LOBBY_TICK = "lobbyTick";
const EVENT_RANDOM_ENCOUNTER_STARTED = "randomEncounterStarted";
const EVENT_GENERATION_PAGE_READY = "generationPageReady";
const EVENT_WIDGET_TICK = "widgetTick";
const EVENT_WIDGET_LINK_FOUND = "widgetLinkFound";
const EVENT_WIDGET_STARTED_ENCOUNTER = "widgetStartedEncounter";
const EVENT_WIDGET_RESET_DAY = "widgetResetDay";
const EVENT_WIDGET_CLICKED = "widgetClicked";
const EVENT_WIDGET_TIMER_ELAPSED = "widgetTimerElapsed";
const EVENT_WIDGET_NEWS_LOADED = "widgetNewsLoaded";
const EVENT_WIDGET_GENERATION_FAILED = "widgetGenerationFailed";

export const EncounterEvent = Object.freeze({
  LOBBY_TICK: EVENT_LOBBY_TICK,
  RANDOM_ENCOUNTER_STARTED: EVENT_RANDOM_ENCOUNTER_STARTED,
  GENERATION_PAGE_READY: EVENT_GENERATION_PAGE_READY,
  WIDGET_TICK: EVENT_WIDGET_TICK,
  WIDGET_LINK_FOUND: EVENT_WIDGET_LINK_FOUND,
  WIDGET_STARTED_ENCOUNTER: EVENT_WIDGET_STARTED_ENCOUNTER,
  WIDGET_RESET_DAY: EVENT_WIDGET_RESET_DAY,
  WIDGET_CLICKED: EVENT_WIDGET_CLICKED,
  WIDGET_TIMER_ELAPSED: EVENT_WIDGET_TIMER_ELAPSED,
  WIDGET_NEWS_LOADED: EVENT_WIDGET_NEWS_LOADED,
  WIDGET_GENERATION_FAILED: EVENT_WIDGET_GENERATION_FAILED,
});

function executeWidgetEvent(event) {
  const outcome = executeEncounterEntry(planEncounterWidgetEvent(event));
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
    result: classifyEncounterGenerationResult({ eventpane: event.eventpane }),
    request: event.request,
    source: event.source,
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
    nowMs: event.nowMs,
  });
  if (!generation.blocked) {
    return { action: "recovery", handled: false, state: generation.state, generation };
  }
  return {
    ...showEncounterGenerationBlock(generation, source),
    state: generation.state,
    generation,
  };
}

function handleWidgetNewsLoaded(event) {
  const result = classifyEncounterGenerationResult({
    eventpane: event.eventpane,
    dawn: event.dawn,
    key: event.key,
    search: event.search,
  });
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

function markRandomEncounterStarted(event) {
  if (!isAutomaticEncounterEnabled()) return { claimed: false, skipped: true };
  const persistence = runEncounterStateAutomation({
    type: EncounterStateEvent.MARK_STARTED,
    search: event.search,
    source: event.source,
  });
  if (!persistence?.ok) {
    return showEncounterGenerationBlock(
      {
        status: "persistenceFailed",
        reason: "encounterStartPersistenceFailed",
        persistence,
        blocked: true,
      },
      "battleStart"
    );
  }
  return { claimed: false };
}

const encounterEventHandlers = Object.freeze({
  [EVENT_LOBBY_TICK]: runEncounterLobbyFlow,
  [EVENT_RANDOM_ENCOUNTER_STARTED]: markRandomEncounterStarted,
  [EVENT_GENERATION_PAGE_READY]: handleGenerationPageReady,
  [EVENT_WIDGET_TICK]: executeWidgetEvent,
  [EVENT_WIDGET_LINK_FOUND]: executeWidgetEvent,
  [EVENT_WIDGET_STARTED_ENCOUNTER]: executeWidgetEvent,
  [EVENT_WIDGET_RESET_DAY]: executeWidgetEvent,
  [EVENT_WIDGET_CLICKED]: executeWidgetEvent,
  [EVENT_WIDGET_TIMER_ELAPSED]: executeWidgetEvent,
  [EVENT_WIDGET_NEWS_LOADED]: handleWidgetNewsLoaded,
  [EVENT_WIDGET_GENERATION_FAILED]: handleWidgetGenerationFailed,
});

export function runEncounterAutomation(event = { type: EVENT_LOBBY_TICK }) {
  const handler = encounterEventHandlers[event?.type];
  if (!handler) {
    return rejectUnknownEncounterEvent(event);
  }
  return handler(event);
}
