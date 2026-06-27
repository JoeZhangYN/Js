import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

function readWidgetState(state) {
  const readiness = runEncounterPolicy({
    type: EncounterPolicyEvent.READINESS,
    state,
  });
  return {
    state: readiness.state,
    remainingMs: readiness.remainingMs,
    count: readiness.state.count,
    status: readiness.remainingMs > 0 ? "countdown" : readiness.state.clear ? "ready" : "missed",
    warn: !readiness.state.clear,
  };
}

function runWidgetLinkFound(event) {
  const key =
    event.key ||
    runEncounterPolicy({
      type: EncounterPolicyEvent.PARSE_SEARCH_KEY,
      search: event.search || "",
    });
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
  return readWidgetState(
    runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_STARTED,
      state: event.state,
      search: event.search || "",
    })
  );
}

function planWidgetClick(event) {
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
  return { ...readWidgetState(plan.state), action: "load", engage: true };
}

function planWidgetNewsLoaded(event) {
  const eventpane = event.eventpane || "";
  const key =
    event.key ||
    runEncounterPolicy({
      type: EncounterPolicyEvent.PARSE_EVENTPANE_KEY,
      eventpane,
    }) ||
    runEncounterPolicy({
      type: EncounterPolicyEvent.PARSE_SEARCH_KEY,
      search: event.search || "",
    });
  if (key) {
    const state = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_KEY_AVAILABLE,
      state: event.state,
      key,
    });
    if (event.engage) return planWidgetEngage({ ...event, state });
    return { ...readWidgetState(state), action: "ready" };
  }
  if (eventpane.includes("It is the dawn of a new day") || event.dawn) {
    return {
      ...readWidgetState(runEncounterPolicy({ type: EncounterPolicyEvent.RESET_DAY })),
      action: "reset",
    };
  }
  return { ...readWidgetState(event.state), action: "unavailable" };
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
    const state = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_STARTED,
      state: plan.state,
      search: plan.href,
    });
    return {
      ...readWidgetState(state),
      action: "open",
      href: `${event.galleryAlt ? "http://alt.hentaiverse.org/" : "https://hentaiverse.org/"}${
        plan.href
      }`,
    };
  }
  return { ...readWidgetState(plan.state), action: "navigate", href: plan.href };
}

export function planEncounterWidgetEvent(event) {
  if (event.type === "widgetTick") return readWidgetState(event.state);
  if (event.type === "widgetLinkFound") return runWidgetLinkFound(event);
  if (event.type === "widgetStartedEncounter") return runWidgetStartedEncounter(event);
  if (event.type === "widgetResetDay") {
    return readWidgetState(runEncounterPolicy({ type: EncounterPolicyEvent.RESET_DAY }));
  }
  if (event.type === "widgetClicked") return planWidgetClick(event);
  if (event.type === "widgetNewsLoaded") return planWidgetNewsLoaded(event);
  return undefined;
}
