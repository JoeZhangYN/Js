import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { EncounterGenerationApplication } from "./encounter-entry-state.js";
import { classifyEncounterGenerationResult } from "./encounter-generation-result.js";
import { observeWidgetEntryStarted, observeWidgetLink } from "./encounter-widget-observation.js";
import { readEncounterWidgetState as readWidgetState } from "./encounter-widget-state.js";

const widgetState = (event, state = event.state) => readWidgetState(state, event);

function suppressIsekaiNavigation(current) {
  return { ...current, action: "none", handled: true, recovery: "isekaiNavigationSuppressed" };
}

function planWidgetClick(event) {
  const current = widgetState(event);
  if (event.pageType === "is") return suppressIsekaiNavigation(current);
  if (event.pageType === "ba") return { ...current, action: "load", engage: true };
  if (event.pageType === "eh" && event.hvAvailable === false) {
    return { ...current, action: "load", engage: true };
  }
  const plan = runEncounterPolicy({
    type: EncounterPolicyEvent.PLAN_ACTIVATION,
    state: current.state,
    nowMs: event.nowMs,
  });
  if (plan.action === "enter") {
    if (event.pageType === "eh") {
      return planWidgetEngage({ ...event, state: plan.state });
    }
    return { ...widgetState(event, plan.state), action: "navigate", href: plan.href };
  }
  return {
    ...widgetState(event, plan.state),
    action: "load",
    engage: true,
    href: plan.request?.url || plan.href,
  };
}

function planWidgetTimerElapsed(event) {
  const current = widgetState(event);
  if (current.operationalStatus === "countdown") return current;
  if (event.pageType === "is") return suppressIsekaiNavigation(current);
  if (event.pageType === "eh") return { ...current, action: "checkHv", engage: true };
  return {
    ...planWidgetClick({ ...event, state: current.state }),
    attemptKey: current.attemptKey,
  };
}

function planWidgetNewsLoaded(event) {
  if (event.pageType === "is") {
    return suppressIsekaiNavigation(widgetState(event));
  }
  const current = widgetState(event);
  const generationResult = classifyEncounterGenerationResult({
    eventpane: event.eventpane,
    dawn: event.dawn,
    key: event.key,
    search: event.search,
  });
  const application = runEncounterPolicy({
    type: EncounterPolicyEvent.APPLY_GENERATION_RESULT,
    state: current.state,
    result: generationResult,
    nowMs: event.nowMs,
    attemptKey: current.attemptKey,
  });
  if (application.application === EncounterGenerationApplication.AVAILABLE) {
    const state = application.state;
    if (event.engage) return planWidgetEngage({ ...event, state });
    return { ...widgetState(event, state), action: "ready" };
  }
  if (application.application === EncounterGenerationApplication.NEW_DAY) {
    return {
      ...widgetState(event, application.state),
      action: "dailyResetEvent",
      unavailableReason: "dailyResetEvent",
    };
  }
  if (application.application === EncounterGenerationApplication.LIMIT_PROBE_EMPTY) {
    return {
      ...widgetState(event, application.state),
      action: "limitProbeEmpty",
      unavailableReason: generationResult.reason,
    };
  }
  if (application.application === EncounterGenerationApplication.ENCOUNTER_FAILED) {
    return {
      ...widgetState(event, application.state),
      action: "unavailable",
      unavailableReason: application.result.reason,
    };
  }
  const unavailableReason = application.result.reason;
  const failureState = widgetState(event, application.state);
  const state = event.engage
    ? runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_GENERATION_FAILED,
        state: failureState.state,
        attemptKey: failureState.attemptKey,
        reason: unavailableReason,
        nowMs: event.nowMs,
      })
    : failureState.state;
  return { ...widgetState(event, state), action: "unavailable", unavailableReason };
}

function planWidgetEngage(event) {
  const plan = runEncounterPolicy({
    type: EncounterPolicyEvent.PLAN_ACTIVATION,
    state: event.state,
    nowMs: event.nowMs,
  });
  if (plan.action !== "enter" || event.pageType === "ba") {
    return { ...widgetState(event, plan.state), action: "none" };
  }
  if (event.pageType === "eh") {
    return {
      ...widgetState(event, plan.state),
      action: "open",
      href: `${event.galleryAlt ? "http://alt.hentaiverse.org/" : "https://hentaiverse.org/"}${
        plan.href
      }`,
    };
  }
  return { ...widgetState(event, plan.state), action: "navigate", href: plan.href };
}

const encounterWidgetPolicyEventHandlers = Object.freeze({
  widgetTick: (event) => widgetState(event),
  widgetLinkFound: observeWidgetLink,
  widgetStartedEncounter: observeWidgetEntryStarted,
  widgetResetDay: (event) =>
    widgetState(
      event,
      runEncounterPolicy({ type: EncounterPolicyEvent.BEGIN_NEW_DAY, nowMs: event.nowMs })
    ),
  widgetClicked: planWidgetClick,
  widgetTimerElapsed: planWidgetTimerElapsed,
  widgetNewsLoaded: planWidgetNewsLoaded,
});

export function planEncounterWidgetEvent(event) {
  return encounterWidgetPolicyEventHandlers[event?.type]?.(event);
}
