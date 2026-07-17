import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { EncounterCheckMode } from "./encounter-check-mode.js";
import { EncounterGenerationApplication } from "./encounter-generation-application.js";
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

export function planEncounterWidgetGeneration(event) {
  if (event.pageType === "is") {
    return suppressIsekaiNavigation(widgetState(event));
  }
  if (event.application === EncounterGenerationApplication.AVAILABLE) {
    return planWidgetEngage(event);
  }
  if (event.application === EncounterGenerationApplication.NEW_DAY) {
    return {
      ...widgetState(event),
      action: "dailyResetEvent",
      unavailableReason: "dailyResetEvent",
    };
  }
  if (event.application === EncounterGenerationApplication.LIMIT_PROBE_EMPTY) {
    return {
      ...widgetState(event),
      action: "limitProbeEmpty",
      unavailableReason: event.result.reason,
    };
  }
  if (
    event.application === EncounterGenerationApplication.MANUAL_EMPTY ||
    event.application === EncounterGenerationApplication.MANUAL_CHECK_FAILED ||
    event.application === EncounterGenerationApplication.AUTOMATIC_CHECK_FAILED
  ) {
    return {
      ...widgetState(event),
      action: "unavailable",
      unavailableReason: event.result.reason,
    };
  }
  return {
    ...widgetState(event),
    action: "unavailable",
    unavailableReason: event.result?.reason,
  };
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
  widgetClicked: planWidgetClick,
});

export function planEncounterWidgetEvent(event) {
  return encounterWidgetPolicyEventHandlers[event?.type]?.(event);
}
