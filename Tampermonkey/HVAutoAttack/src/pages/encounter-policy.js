const ENCOUNTER_INTERVAL_MS = 30 * 60 * 1000,
  ENCOUNTER_DAILY_LIMIT = 24;
const ENCOUNTER_MIDNIGHT_GRACE_MS = 5000;

const ONE_MINUTE_MS = 60 * 1000;

export const EncounterPolicyEvent = Object.freeze({
  DEFAULT_STATE: "defaultState",
  NORMALIZE: "normalize",
  READINESS: "readiness",
  NEXT_CHECK_DELAY: "nextCheckDelay",
  PLAN_ACTIVATION: "planActivation",
  PARSE_SEARCH_KEY: "parseSearchKey",
  PARSE_EVENTPANE_KEY: "parseEventpaneKey",
  MARK_KEY_AVAILABLE: "markKeyAvailable",
  MARK_STARTED: "markStarted",
  RESET_DAY: "resetDay",
});

const defaultEncounterState = () => ({ date: 0, key: "", count: 0, clear: true });

function isDifferentUtcDay(dateMs, nowMs) {
  const date = new Date(dateMs);
  const now = new Date(nowMs);
  return (
    date.getUTCDate() !== now.getUTCDate() ||
    date.getUTCMonth() !== now.getUTCMonth() ||
    date.getUTCFullYear() !== now.getUTCFullYear()
  );
}

function msUntilNextUtcMidnight(nowMs) {
  const now = new Date(nowMs);
  const nextMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return nextMidnight - nowMs;
}

function resetEncounterDay() {
  return defaultEncounterState();
}

function normalizeEncounterState(state, nowMs = Date.now()) {
  const normalized = {
    date: Number(state?.date) || 0,
    key: state?.key || "",
    count: Number(state?.count) || 0,
    clear: state?.clear !== false,
  };
  if (normalized.date && isDifferentUtcDay(normalized.date, nowMs)) {
    return resetEncounterDay(nowMs);
  }
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

function msUntilNextEncounterCheck(state, { nowMs = Date.now(), jitter = Math.random() } = {}) {
  const readiness = readEncounterReadiness(state, nowMs);
  const jitteredMinute = ONE_MINUTE_MS * (0.95 + Math.max(0, Math.min(1, jitter)) * 0.1);
  const readyDelay = readiness.remainingMs + ENCOUNTER_MIDNIGHT_GRACE_MS;
  const midnightDelay = msUntilNextUtcMidnight(nowMs) + ENCOUNTER_MIDNIGHT_GRACE_MS;
  return Math.min(jitteredMinute, readyDelay, midnightDelay);
}

function planEncounterActivation(state, { force = false, nowMs = Date.now() } = {}) {
  const readiness = readEncounterReadiness(state, nowMs);
  if (readiness.canEnter || (force && readiness.state.key)) {
    return {
      action: "enter",
      href: buildEncounterUrl(readiness.state.key),
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

function buildEncounterUrl(key) {
  return `?s=Battle&ss=ba&encounter=${key}`;
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

export function runEncounterPolicy(event = { type: EncounterPolicyEvent.READINESS }) {
  if (event.type === EncounterPolicyEvent.DEFAULT_STATE) return defaultEncounterState();
  if (event.type === EncounterPolicyEvent.RESET_DAY) return resetEncounterDay();
  if (event.type === EncounterPolicyEvent.NORMALIZE) {
    return normalizeEncounterState(event.state, event.nowMs);
  }
  if (event.type === EncounterPolicyEvent.READINESS) {
    return readEncounterReadiness(event.state, event.nowMs);
  }
  if (event.type === EncounterPolicyEvent.NEXT_CHECK_DELAY) {
    return msUntilNextEncounterCheck(event.state, {
      nowMs: event.nowMs,
      jitter: event.jitter,
    });
  }
  if (event.type === EncounterPolicyEvent.PLAN_ACTIVATION) {
    return planEncounterActivation(event.state, {
      force: event.force,
      nowMs: event.nowMs,
    });
  }
  if (event.type === EncounterPolicyEvent.PARSE_SEARCH_KEY) {
    return parseEncounterKeyFromSearch(event.search);
  }
  if (event.type === EncounterPolicyEvent.PARSE_EVENTPANE_KEY) {
    return parseEncounterKeyFromEventpaneHtml(event.eventpane);
  }
  if (event.type === EncounterPolicyEvent.MARK_KEY_AVAILABLE) {
    return markEncounterKeyAvailable(event.state, event.key, event.nowMs);
  }
  if (event.type === EncounterPolicyEvent.MARK_STARTED) {
    return markEncounterStarted(event.state, {
      search: event.search,
      key: event.key,
      nowMs: event.nowMs,
    });
  }
  return undefined;
}
