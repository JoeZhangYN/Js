import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { EncounterGenerationApplication } from "./encounter-entry-state.js";
import { classifyEncounterGenerationResult } from "./encounter-generation-result.js";
import { readEncounterWidgetState as readWidgetState } from "./encounter-widget-state.js";

function suppressIsekaiNavigation(current) {
  return { ...current, action: "none", handled: true, recovery: "isekaiNavigationSuppressed" };
}

function runWidgetLinkFound(event) {
  const key =
    event.key ||
    runEncounterPolicy({ type: EncounterPolicyEvent.PARSE_SEARCH_KEY, search: event.search || "" });
  const state = key
    ? runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_KEY_AVAILABLE,
        state: event.state,
        key,
      })
    : runEncounterPolicy({
        type: EncounterPolicyEvent.NORMALIZE,
        state: event.state,
      });
  return readWidgetState(state);
}

function runWidgetStartedEncounter(event) {
  if (event.pageType !== "ba") return readWidgetState(event.state);
  const key =
    event.key ||
    runEncounterPolicy({
      type: EncounterPolicyEvent.PARSE_SEARCH_KEY,
      search: event.search || "",
    });
  if (!key) return readWidgetState(event.state);
  return readWidgetState(
    runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_ENTRY_STARTED,
      state: event.state,
      key,
      search: event.search,
      source: "encounterWidget",
      nowMs: event.nowMs,
    })
  );
}

function planWidgetClick(event) {
  const current = readWidgetState(event.state);
  if (event.pageType === "is") return suppressIsekaiNavigation(current);
  if (current.status === "countdown" && !event.force) {
    return { ...current, action: "none", handled: true };
  }
  if (event.pageType === "ba") return { action: "load" };
  if (event.pageType === "eh" && event.hvAvailable === false) return { action: "load" };
  const plan = runEncounterPolicy({
    type: EncounterPolicyEvent.PLAN_ACTIVATION,
    state: event.state,
    force: Boolean(event.force),
  });
  if (plan.action === "enter") {
    if (event.pageType === "eh") {
      return planWidgetEngage({ ...event, state: plan.state });
    }
    return { ...readWidgetState(plan.state), action: "navigate", href: plan.href };
  }
  return {
    ...readWidgetState(plan.state),
    action: "load",
    engage: true,
    href: plan.request?.url || plan.href,
  };
}

function planWidgetTimerElapsed(event) {
  const current = readWidgetState(event.state);
  if (current.status === "countdown") return current;
  if (event.pageType === "is") return suppressIsekaiNavigation(current);
  if (event.pageType === "eh") return { ...current, action: "checkHv", engage: true };
  return {
    ...planWidgetClick({ ...event, force: true }),
    attemptKey: current.attemptKey,
  };
}

function planWidgetNewsLoaded(event) {
  if (event.pageType === "is") return suppressIsekaiNavigation(readWidgetState(event.state));
  const generationResult = classifyEncounterGenerationResult({
    eventpane: event.eventpane,
    dawn: event.dawn,
    key: event.key,
    search: event.search,
  });
  const application = runEncounterPolicy({
    type: EncounterPolicyEvent.APPLY_GENERATION_RESULT,
    state: event.state,
    result: generationResult,
    nowMs: event.nowMs,
  });
  if (application.application === EncounterGenerationApplication.AVAILABLE) {
    const state = application.state;
    if (event.engage) return planWidgetEngage({ ...event, state });
    return { ...readWidgetState(state), action: "ready" };
  }
  if (application.application === EncounterGenerationApplication.NEW_DAY) {
    return {
      ...readWidgetState(application.state),
      action: "dailyResetEvent",
      unavailableReason: "dailyResetEvent",
    };
  }
  if (application.application === EncounterGenerationApplication.LIMIT_PROBE_EMPTY) {
    return {
      ...readWidgetState(application.state),
      action: "limitProbeEmpty",
      unavailableReason: generationResult.reason,
    };
  }
  const unavailableReason = application.result.reason;
  const current = readWidgetState(application.state);
  const state = event.engage
    ? runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_GENERATION_ATTEMPTED,
        state: current.state,
        attemptKey: current.attemptKey,
        reason: unavailableReason,
      })
    : current.state;
  return { ...readWidgetState(state), action: "unavailable", unavailableReason };
}

function planWidgetEngage(event) {
  const plan = runEncounterPolicy({
    type: EncounterPolicyEvent.PLAN_ACTIVATION,
    state: event.state,
    force: true,
  });
  if (plan.action !== "enter" || event.pageType === "ba") {
    return { ...readWidgetState(plan.state), action: "none" };
  }
  if (event.pageType === "eh") {
    return {
      ...readWidgetState(plan.state),
      action: "open",
      href: `${event.galleryAlt ? "http://alt.hentaiverse.org/" : "https://hentaiverse.org/"}${
        plan.href
      }`,
    };
  }
  return { ...readWidgetState(plan.state), action: "navigate", href: plan.href };
}

const encounterWidgetPolicyEventHandlers = Object.freeze({
  widgetTick: (event) => readWidgetState(event.state),
  widgetLinkFound: runWidgetLinkFound,
  widgetStartedEncounter: runWidgetStartedEncounter,
  widgetResetDay: () =>
    readWidgetState(runEncounterPolicy({ type: EncounterPolicyEvent.BEGIN_NEW_DAY })),
  widgetClicked: planWidgetClick,
  widgetTimerElapsed: planWidgetTimerElapsed,
  widgetNewsLoaded: planWidgetNewsLoaded,
});

export function planEncounterWidgetEvent(event) {
  return encounterWidgetPolicyEventHandlers[event?.type]?.(event);
}
