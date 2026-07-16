import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { EncounterCheckMode } from "./encounter-check-mode.js";
import { EncounterGenerationApplication } from "./encounter-generation-application.js";
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
  if (event.pageType === "ba") {
    return { ...current, action: "load", checkMode: EncounterCheckMode.MANUAL };
  }
  if (event.pageType === "eh" && event.hvAvailable === false) {
    return { ...current, action: "load", checkMode: EncounterCheckMode.MANUAL };
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
    checkMode: EncounterCheckMode.MANUAL,
    href: plan.request?.url || plan.href,
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
    eventpanePresent: event.eventpanePresent,
  });
  const application = runEncounterPolicy({
    type: EncounterPolicyEvent.APPLY_GENERATION_RESULT,
    state: current.state,
    result: generationResult,
    nowMs: event.nowMs,
    attemptKey: current.attemptKey,
    checkMode: event.checkMode || EncounterCheckMode.MANUAL,
  });
  if (application.application === EncounterGenerationApplication.AVAILABLE) {
    const state = application.state;
    return planWidgetEngage({ ...event, state });
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
  if (
    application.application === EncounterGenerationApplication.MANUAL_EMPTY ||
    application.application === EncounterGenerationApplication.MANUAL_CHECK_FAILED ||
    application.application === EncounterGenerationApplication.AUTOMATIC_CHECK_FAILED
  ) {
    return {
      ...widgetState(event, application.state),
      action: "unavailable",
      unavailableReason: application.result.reason,
    };
  }
  const unavailableReason = application.result.reason;
  return { ...widgetState(event, application.state), action: "unavailable", unavailableReason };
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
  widgetNewsLoaded: planWidgetNewsLoaded,
});

export function planEncounterWidgetEvent(event) {
  return encounterWidgetPolicyEventHandlers[event?.type]?.(event);
}
