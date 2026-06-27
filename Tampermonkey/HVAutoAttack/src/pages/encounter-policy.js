export const ENCOUNTER_INTERVAL_MS = 30 * 60 * 1000;

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

export function resetEncounterDay(nowMs = Date.now()) {
  return { date: nowMs, key: "", count: 0, clear: true };
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
