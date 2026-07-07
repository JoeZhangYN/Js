import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

function readWidgetState(state) {
  const clock = runEncounterPolicy({
    type: EncounterPolicyEvent.READ_CLOCK,
    state,
  });
  return {
    state: clock.state,
    remainingMs: clock.countdownMs,
    count: clock.state.count,
    status: clock.status,
    reason: clock.reason,
    attemptKey: `${clock.state.date}:${clock.state.key}:${clock.state.clear}:${clock.status}`,
    warn: !clock.state.clear,
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
  const key = event.key || runEncounterPolicy({
    type: EncounterPolicyEvent.PARSE_SEARCH_KEY,
    search: event.search || "",
  });
  if (!key) return readWidgetState(event.state);
  return readWidgetState(
    runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_STARTED,
      state: event.state,
      key,
    })
  );
}

function planWidgetClick(event) {
  const current = readWidgetState(event.state);
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
  return { ...readWidgetState(plan.state), action: "load", engage: true, href: plan.href };
}

function planWidgetTimerElapsed(event) {
  const current = readWidgetState(event.state);
  if (current.status === "countdown") return current;
  if (event.lastAttemptKey === current.attemptKey) return { ...current, action: "none" };
  if (event.pageType === "eh") return { ...current, action: "checkHv", engage: true };
  return {
    ...planWidgetClick({ ...event, force: true }),
    attemptKey: current.attemptKey,
  };
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
  const unavailableReason = classifyWidgetUnavailableReason(eventpane);
  const state = event.engage && unavailableReason === "encounterKeyMissing"
    ? runEncounterPolicy({ type: EncounterPolicyEvent.MARK_GENERATION_ATTEMPTED, state: event.state })
    : event.state;
  return { ...readWidgetState(state), action: "unavailable", unavailableReason };
}

function classifyWidgetUnavailableReason(eventpane) {
  if (/<p[^>]*class=["'][^"']*\bmessagebox_error\b[^"']*["'][^>]*>\s*Your equipment inventory is full\s*<\/p>/i.test(eventpane)) {
    return "equipmentInventoryFull";
  }
  return "encounterKeyMissing";
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
  widgetResetDay: () => readWidgetState(runEncounterPolicy({ type: EncounterPolicyEvent.RESET_DAY })),
  widgetClicked: planWidgetClick,
  widgetTimerElapsed: planWidgetTimerElapsed,
  widgetNewsLoaded: planWidgetNewsLoaded,
});

export function planEncounterWidgetEvent(event) {
  return encounterWidgetPolicyEventHandlers[event?.type]?.(event);
}
