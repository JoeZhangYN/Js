import { TimeEvent, runTimeAutomation } from "../core/time.js";

const ENCOUNTER_INTERVAL_MS = 30 * 60 * 1000,
  ENCOUNTER_DAILY_LIMIT = 24,
  ENCOUNTER_MIDNIGHT_GRACE_MS = 5000;

export const EncounterPolicyEvent = Object.freeze({
  DEFAULT_STATE: "defaultState",
  NORMALIZE: "normalize",
  READ_CLOCK: "readClock",
  PLAN_NEXT_CHECK: "planNextCheck",
  PLAN_ACTIVATION: "planActivation",
  PARSE_SEARCH_KEY: "parseSearchKey",
  PARSE_EVENTPANE_KEY: "parseEventpaneKey",
  MARK_KEY_AVAILABLE: "markKeyAvailable",
  MARK_STARTED: "markStarted",
  RESET_DAY: "resetDay",
});

const defaultEncounterState = () => ({ date: 0, key: "", count: 0, clear: true });

function isDifferentUtcDay(dateMs, nowMs) {
  return new Date(dateMs).toISOString().slice(0, 10) !== new Date(nowMs).toISOString().slice(0, 10);
}

const msUntilNextUtcDay = (stamp) =>
  runTimeAutomation({ type: TimeEvent.MS_UNTIL_NEXT_UTC_DAY, stamp });

function normalizeEncounterState(state, nowMs = Date.now()) {
  const normalized = {
    date: Number(state?.date) || 0,
    key: state?.key || "",
    count: Number(state?.count) || 0,
    clear: state?.clear !== false,
  };
  if (normalized.date && isDifferentUtcDay(normalized.date, nowMs)) return defaultEncounterState();
  return normalized;
}

function msUntilEncounterReady(state, nowMs = Date.now()) {
  const normalized = normalizeEncounterState(state, nowMs);
  return Math.max(0, normalized.date + ENCOUNTER_INTERVAL_MS - nowMs);
}

function readEncounterReadiness(state, nowMs = Date.now()) {
  const normalized = normalizeEncounterState(state, nowMs);
  return {
    state: normalized,
    remainingMs: msUntilEncounterReady(normalized, nowMs),
    canEnter: Boolean(normalized.key && !normalized.clear),
    dailyLimitReached: normalized.count >= ENCOUNTER_DAILY_LIMIT,
  };
}

function countdownEncounterClock(readiness, countdownMs, reason) {
  return { ...readiness, status: "countdown", countdownMs, reason };
}

function readEncounterClock(state, nowMs = Date.now()) {
  const readiness = readEncounterReadiness(state, nowMs);
  if (readiness.dailyLimitReached) {
    return countdownEncounterClock(
      readiness,
      msUntilNextUtcDay(nowMs) + ENCOUNTER_MIDNIGHT_GRACE_MS,
      "dailyReset"
    );
  }
  if (readiness.remainingMs > 0) {
    return countdownEncounterClock(readiness, readiness.remainingMs, "cooldown");
  }
  return {
    ...readiness,
    status: readiness.state.clear ? "ready" : "missed",
    countdownMs: 0,
    reason: readiness.canEnter ? "keyAvailable" : "readyWindow",
  };
}

function planNextEncounterCheck(state, { nowMs = Date.now(), jitter = Math.random() } = {}) {
  const clock = readEncounterClock(state, nowMs);
  const jitteredMinute = 60 * 1000 * (0.95 + Math.max(0, Math.min(1, jitter)) * 0.1);
  const readyDelay = clock.countdownMs + ENCOUNTER_MIDNIGHT_GRACE_MS;
  const midnightDelay = msUntilNextUtcDay(nowMs) + ENCOUNTER_MIDNIGHT_GRACE_MS;
  const delayMs = Math.min(jitteredMinute, readyDelay, midnightDelay);
  return { delayMs, reason: clock.reason, status: clock.status, clock };
}

function planEncounterActivation(state, { force = false, nowMs = Date.now() } = {}) {
  const readiness = readEncounterReadiness(state, nowMs);
  if (readiness.canEnter || (force && readiness.state.key)) {
    return {
      action: "enter",
      href: `?s=Battle&ss=ba&encounter=${readiness.state.key}`,
      state: readiness.state,
    };
  }
  return { action: "load", state: readiness.state };
}

function parseEncounterKeyFromSearch(search = "") {
  return /\?s=Battle&ss=ba&encounter=([A-Za-z0-9=]+)/.exec(search)?.[1];
}

function parseEncounterKeyFromEventpaneHtml(eventpane = "") {
  return eventpane.match(/\?s=Battle&amp;ss=ba&amp;encounter=([A-Za-z0-9=]+)/)?.[1];
}

function markEncounterKeyAvailable(state, key, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (!key) return next;
  next.date = nowMs;
  next.key = key;
  next.count++;
  next.clear = false;
  return next;
}

function markEncounterStarted(
  state,
  { search = "", key = parseEncounterKeyFromSearch(search), nowMs = Date.now() } = {}
) {
  const next = normalizeEncounterState(state, nowMs);
  if (key && next.key === key) {
    next.clear = true;
  } else if (!key || msUntilEncounterReady(next, nowMs) === 0) {
    next.date = nowMs;
    next.key = key || next.key || "";
    next.count++;
    next.clear = true;
  }
  return next;
}

export function runEncounterPolicy(event = { type: EncounterPolicyEvent.READ_CLOCK }) {
  switch (event.type) {
    case EncounterPolicyEvent.DEFAULT_STATE:
    case EncounterPolicyEvent.RESET_DAY:
      return defaultEncounterState();
    case EncounterPolicyEvent.NORMALIZE:
      return normalizeEncounterState(event.state, event.nowMs);
    case EncounterPolicyEvent.READ_CLOCK:
      return readEncounterClock(event.state, event.nowMs);
    case EncounterPolicyEvent.PLAN_NEXT_CHECK:
      return planNextEncounterCheck(event.state, { nowMs: event.nowMs, jitter: event.jitter });
    case EncounterPolicyEvent.PLAN_ACTIVATION:
      return planEncounterActivation(event.state, { force: event.force, nowMs: event.nowMs });
    case EncounterPolicyEvent.PARSE_SEARCH_KEY:
      return parseEncounterKeyFromSearch(event.search);
    case EncounterPolicyEvent.PARSE_EVENTPANE_KEY:
      return parseEncounterKeyFromEventpaneHtml(event.eventpane);
    case EncounterPolicyEvent.MARK_KEY_AVAILABLE:
      return markEncounterKeyAvailable(event.state, event.key, event.nowMs);
    case EncounterPolicyEvent.MARK_STARTED:
      return markEncounterStarted(event.state, {
        search: event.search,
        key: event.key,
        nowMs: event.nowMs,
      });
    default:
      return undefined;
  }
}
