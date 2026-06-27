export const ENCOUNTER_INTERVAL_MS = 30 * 60 * 1000;
export const ENCOUNTER_DAILY_LIMIT = 24;
export const ENCOUNTER_MIDNIGHT_GRACE_MS = 5000;

const ONE_MINUTE_MS = 60 * 1000;

export function defaultEncounterState() {
  return { date: 0, key: "", count: 0, clear: true };
}

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

export function resetEncounterDay(nowMs = Date.now()) {
  void nowMs;
  return defaultEncounterState();
}

export function normalizeEncounterState(state, nowMs = Date.now()) {
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

export function msUntilEncounterReady(state, nowMs = Date.now()) {
  const normalized = normalizeEncounterState(state, nowMs);
  return Math.max(0, normalized.date + ENCOUNTER_INTERVAL_MS - nowMs);
}

export function canEnterEncounterState(state, nowMs = Date.now()) {
  const normalized = normalizeEncounterState(state, nowMs);
  return Boolean(normalized.key && !normalized.clear);
}

export function readEncounterReadiness(state, nowMs = Date.now()) {
  const normalized = normalizeEncounterState(state, nowMs);
  return {
    state: normalized,
    remainingMs: msUntilEncounterReady(normalized, nowMs),
    canEnter: canEnterEncounterState(normalized, nowMs),
    dailyLimitReached: normalized.count >= ENCOUNTER_DAILY_LIMIT,
  };
}

export function msUntilNextEncounterCheck(
  state,
  { nowMs = Date.now(), jitter = Math.random() } = {}
) {
  const readiness = readEncounterReadiness(state, nowMs);
  const jitteredMinute = ONE_MINUTE_MS * (0.95 + Math.max(0, Math.min(1, jitter)) * 0.1);
  const readyDelay = readiness.remainingMs + ENCOUNTER_MIDNIGHT_GRACE_MS;
  const midnightDelay = msUntilNextUtcMidnight(nowMs) + ENCOUNTER_MIDNIGHT_GRACE_MS;
  return Math.min(jitteredMinute, readyDelay, midnightDelay);
}

export function planEncounterActivation(state, { force = false, nowMs = Date.now() } = {}) {
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

export function parseEncounterKeyFromSearch(search = "") {
  return /\?s=Battle&ss=ba&encounter=([A-Za-z0-9=]+)/.exec(search)?.[1];
}

export function parseEncounterKeyFromEventpaneHtml(eventpane = "") {
  return eventpane.match(/\?s=Battle&amp;ss=ba&amp;encounter=([A-Za-z0-9=]+)/)?.[1];
}

export function buildEncounterUrl(key) {
  return `?s=Battle&ss=ba&encounter=${key}`;
}

export function markEncounterKeyAvailable(state, key, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (!key) return next;
  next.date = nowMs;
  next.key = key;
  next.count++;
  next.clear = false;
  return next;
}

export function markEncounterStarted(
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
