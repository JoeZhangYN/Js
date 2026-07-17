import { EncounterCheckMode } from "./encounter-check-mode.js";
import { executeEncounterEntry } from "./encounter-entry-execution.js";
import { showEncounterGenerationBlock } from "./encounter-generation-block.js";
import {
  EncounterGenerationFailureReason,
  EncounterGenerationResultStatus,
  classifyEncounterGenerationResult,
} from "./encounter-generation-result.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";
import {
  planEncounterWidgetEvent,
  planEncounterWidgetGeneration,
} from "./encounter-widget-policy.js";

const EVENT_WIDGET_TICK = "widgetTick";
const EVENT_WIDGET_LINK_FOUND = "widgetLinkFound";
const EVENT_WIDGET_RESET_DAY = "widgetResetDay";
const EVENT_WIDGET_CLICKED = "widgetClicked";
const EVENT_WIDGET_NEWS_LOADED = "widgetNewsLoaded";
const EVENT_WIDGET_GENERATION_FAILED = "widgetGenerationFailed";

function widgetSource(event) {
  return {
    identity: "encounterWidget",
    pageKind: event.pageType === "eh" ? "ehentai" : event.pageType,
  };
}

function showStateReadFailure(snapshot) {
  return {
    action: "stateReadFailed",
    blocked: true,
    reason: "encounterStateReadFailed",
    state: snapshot?.state,
    persistence: snapshot,
  };
}

function showEntryBlock(outcome) {
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

function executeWidgetPlan(plan) {
  return showEntryBlock(executeEncounterEntry(plan));
}

function readWidgetSnapshot(event) {
  const snapshot = runEncounterStateAutomation({ type: EncounterStateEvent.READ_SNAPSHOT });
  if (!snapshot?.ok) return showStateReadFailure(snapshot);
  return executeWidgetPlan(planEncounterWidgetEvent({ ...event, state: snapshot.state }));
}

function recordWidgetGeneration(event, result) {
  const source = widgetSource(event);
  const generation = runEncounterStateAutomation({
    type: EncounterStateEvent.RECORD_GENERATION_RESULT,
    result,
    request: event.request,
    source,
    checkMode: event.checkMode || EncounterCheckMode.MANUAL,
    nowMs: event.nowMs,
  });
  if (!generation.blocked) return generation;
  return {
    ...showEncounterGenerationBlock(generation, source),
    state: generation.state,
    generation,
  };
}

function projectRecordedState(event, generation) {
  return planEncounterWidgetEvent({
    ...event,
    type: EVENT_WIDGET_TICK,
    state: generation.state,
  });
}

function handleWidgetLinkFound(event) {
  const generation = recordWidgetGeneration(event, classifyEncounterGenerationResult(event));
  if (generation.blocked) return generation;
  return projectRecordedState(event, generation);
}

function handleWidgetResetDay(event) {
  const generation = recordWidgetGeneration(event, {
    status: EncounterGenerationResultStatus.NEW_DAY,
    reason: EncounterGenerationFailureReason.DAILY_RESET_EVENT,
  });
  if (generation.blocked) return generation;
  return projectRecordedState(event, generation);
}

function handleWidgetNewsLoaded(event) {
  const generation = recordWidgetGeneration(event, classifyEncounterGenerationResult(event));
  if (generation.blocked) return generation;
  const outcome = executeWidgetPlan(
    planEncounterWidgetGeneration({
      ...event,
      state: generation.state,
      application: generation.application,
      result: generation.result,
    })
  );
  return { ...outcome, generation };
}

function handleWidgetGenerationFailed(event) {
  const generation = recordWidgetGeneration(
    event,
    classifyEncounterGenerationResult({
      transportFailure: {
        reason: event.reason || EncounterGenerationFailureReason.REQUEST_FAILED,
        detail: event.detail,
      },
    })
  );
  if (generation.blocked) return generation;
  const outcome = executeWidgetPlan(
    planEncounterWidgetGeneration({
      ...event,
      state: generation.state,
      application: generation.application,
      result: generation.result,
    })
  );
  return { ...outcome, handled: true, generation };
}

const widgetFlowHandlers = Object.freeze({
  [EVENT_WIDGET_TICK]: readWidgetSnapshot,
  [EVENT_WIDGET_LINK_FOUND]: handleWidgetLinkFound,
  [EVENT_WIDGET_RESET_DAY]: handleWidgetResetDay,
  [EVENT_WIDGET_CLICKED]: readWidgetSnapshot,
  [EVENT_WIDGET_NEWS_LOADED]: handleWidgetNewsLoaded,
  [EVENT_WIDGET_GENERATION_FAILED]: handleWidgetGenerationFailed,
});

export function runEncounterWidgetFlow(event) {
  return widgetFlowHandlers[event?.type]?.(event);
}
