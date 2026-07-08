import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { parseEventpaneEncounterKey, parseSearchEncounterKey, planEncounterEntryRoute } from "./encounter-entry-policy.js";
import { buildGenerationAttemptKey, carryGenerationRecovery, clearGenerationRecovery, markEncounterGenerationAttempted, readGenerationRecovery } from "./encounter-generation-recovery.js";

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
  MARK_ATTEMPTED: "markAttempted",
  MARK_GENERATION_ATTEMPTED: "markGenerationAttempted",
  MARK_STARTED: "markStarted",
  RESET_DAY: "resetDay",
});

const defaultEncounterState = () => ({ date: 0, key: "", count: 0, clear: true });

const isDifferentUtcDay = (dateMs, nowMs) => new Date(dateMs).toISOString().slice(0, 10) !== new Date(nowMs).toISOString().slice(0, 10);

const msUntilNextUtcDay = (stamp) => runTimeAutomation({ type: TimeEvent.MS_UNTIL_NEXT_UTC_DAY, stamp });

function normalizeEncounterState(state, nowMs = Date.now()) {
  const normalized = {
    date: Number(state?.date) || 0,
    key: state?.key || "",
    count: Number(state?.count) || 0,
    clear: state?.clear !== false,
  };
  carryGenerationRecovery(normalized, state, nowMs);
  if (normalized.count > ENCOUNTER_DAILY_LIMIT) return defaultEncounterState();
  if (!normalized.date && (normalized.count || (!normalized.key && !normalized.clear))) {
    return defaultEncounterState();
  }
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

const countdownEncounterClock = (readiness, countdownMs, reason, nowMs = Date.now()) => ({
  ...readiness,
  status: "countdown",
  countdownMs,
  reason,
  attemptKey: buildGenerationAttemptKey(readiness.state, nowMs, "countdown"),
});

function readEncounterClock(state, nowMs = Date.now()) {
  const readiness = readEncounterReadiness(state, nowMs);
  if (readiness.canEnter) {
    return {
      ...readiness,
      status: "ready",
      countdownMs: 0,
      reason: "keyAvailable",
      attemptKey: buildGenerationAttemptKey(readiness.state, nowMs, "ready"),
    };
  }
  if (readiness.dailyLimitReached) {
    return countdownEncounterClock(
      readiness,
      msUntilNextUtcDay(nowMs) + ENCOUNTER_MIDNIGHT_GRACE_MS,
      "dailyReset",
      nowMs
    );
  }
  if (readiness.remainingMs > 0) {
    return countdownEncounterClock(readiness, readiness.remainingMs, "cooldown", nowMs);
  }
  const recovery = readGenerationRecovery(readiness.state, nowMs);
  if (recovery) return { ...readiness, ...recovery, attemptKey: readiness.state.generationAttemptKey };
  const status = readiness.state.clear ? "ready" : "missed";
  return {
    ...readiness,
    status,
    countdownMs: 0,
    reason: "readyWindow",
    attemptKey: buildGenerationAttemptKey(readiness.state, nowMs, status),
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

function planEncounterActivation(state, { force: _force = false, nowMs = Date.now() } = {}) {
  const readiness = readEncounterReadiness(state, nowMs);
  return planEncounterEntryRoute(readiness);
}

function markEncounterKeyAvailable(state, key, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (!key) return next;
  if (next.key === key) return next;
  next.key = key;
  next.clear = false;
  return clearGenerationRecovery(next);
}

function markEncounterAttempted(state, key, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (!key || next.key !== key) return next;
  next.clear = true;
  return next;
}

function markEncounterStarted(state, event = {}) {
  const { search = "", source = "", nowMs = Date.now() } = event;
  const key = event.key || parseSearchEncounterKey(search);
  const next = normalizeEncounterState(state, nowMs);
  const hasBattleStartEvidence = source === "battleRoundStart";
  if (!key && !hasBattleStartEvidence) return next;
  if (key && next.key !== key && msUntilEncounterReady(next, nowMs) > 0) return next;
  if (key || hasBattleStartEvidence) {
    next.date = nowMs;
    next.key = key || next.key || "";
    next.count++;
    next.clear = true;
    clearGenerationRecovery(next);
  }
  return next;
}

const encounterPolicyEventHandlers = Object.freeze({
  [EncounterPolicyEvent.DEFAULT_STATE]: () => defaultEncounterState(),
  [EncounterPolicyEvent.RESET_DAY]: () => defaultEncounterState(),
  [EncounterPolicyEvent.NORMALIZE]: (event) => normalizeEncounterState(event.state, event.nowMs),
  [EncounterPolicyEvent.READ_CLOCK]: (event) => readEncounterClock(event.state, event.nowMs),
  [EncounterPolicyEvent.PLAN_NEXT_CHECK]: (event) => planNextEncounterCheck(event.state, { nowMs: event.nowMs, jitter: event.jitter }),
  [EncounterPolicyEvent.PLAN_ACTIVATION]: (event) => planEncounterActivation(event.state, { force: event.force, nowMs: event.nowMs }),
  [EncounterPolicyEvent.PARSE_SEARCH_KEY]: (event) => parseSearchEncounterKey(event.search),
  [EncounterPolicyEvent.PARSE_EVENTPANE_KEY]: (event) => parseEventpaneEncounterKey(event.eventpane),
  [EncounterPolicyEvent.MARK_KEY_AVAILABLE]: (event) => markEncounterKeyAvailable(event.state, event.key, event.nowMs),
  [EncounterPolicyEvent.MARK_ATTEMPTED]: (event) => markEncounterAttempted(event.state, event.key, event.nowMs),
  [EncounterPolicyEvent.MARK_GENERATION_ATTEMPTED]: (event) => markEncounterGenerationAttempted(event.state, event.attemptKey, event.nowMs, event.reason),
  [EncounterPolicyEvent.MARK_STARTED]: (event) => markEncounterStarted(event.state, event),
});

export function runEncounterPolicy(event = { type: EncounterPolicyEvent.READ_CLOCK }) {
  return encounterPolicyEventHandlers[event?.type]?.(event);
}
