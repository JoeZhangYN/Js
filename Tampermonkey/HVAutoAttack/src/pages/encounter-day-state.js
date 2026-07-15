import {
  carryGenerationSchedule,
  clearEncounterGenerationSchedule,
  clearGenerationRecovery,
} from "./encounter-generation-recovery.js";
import { EncounterGenerationFailureReason } from "./encounter-generation-result.js";

export const ENCOUNTER_DAILY_LIMIT = 24;
export const ENCOUNTER_COOLDOWN_MS = 30 * 60 * 1000 + 5000;
export const ENCOUNTER_LIMIT_EMPTY_CYCLES = 3;

export const EncounterDayPhase = Object.freeze({
  AWAITING_NEW_DAY: "awaitingNewDay",
  ACTIVE: "active",
  CONFIRMING_LIMIT: "confirmingLimit",
  STOPPED_FOR_DAY: "stoppedForDay",
});

export const EncounterAnchorReason = Object.freeze({
  NEW_DAY: "newDay",
  ENCOUNTER_COMPLETED: "encounterCompleted",
  LIMIT_PROBE: "limitProbe",
});

const validPhases = new Set(Object.values(EncounterDayPhase));
const validAnchors = new Set(Object.values(EncounterAnchorReason));
const validProbeReasons = new Set([
  EncounterGenerationFailureReason.ENCOUNTER_KEY_MISSING,
  EncounterGenerationFailureReason.ENCOUNTER_KEY_ALREADY_ATTEMPTED,
]);
const utcDayKey = (stamp) => new Date(stamp).toISOString().slice(0, 10);

export function defaultEncounterState(nowMs = Date.now()) {
  return {
    date: 0,
    key: "",
    count: 0,
    clear: true,
    schemaVersion: 2,
    utcDay: utcDayKey(nowMs),
    dayPhase: EncounterDayPhase.ACTIVE,
    anchorReason: null,
    invalidCycleCount: 0,
  };
}

export function beginEncounterDay(nowMs = Date.now()) {
  const next = defaultEncounterState(nowMs);
  next.dayPhase = EncounterDayPhase.AWAITING_NEW_DAY;
  return next;
}

export function normalizeEncounterState(state, nowMs = Date.now()) {
  const source = state && typeof state === "object" ? state : {};
  const date = Math.max(0, Number(source.date) || 0);
  const count = Math.min(ENCOUNTER_DAILY_LIMIT, Math.max(0, Number(source.count) || 0));
  const sourceDay = source.utcDay || (date ? utcDayKey(date) : utcDayKey(nowMs));
  if (sourceDay !== utcDayKey(nowMs)) return beginEncounterDay(nowMs);

  let dayPhase = validPhases.has(source.dayPhase)
    ? source.dayPhase
    : count >= ENCOUNTER_DAILY_LIMIT
      ? EncounterDayPhase.CONFIRMING_LIMIT
      : EncounterDayPhase.ACTIVE;
  if (count < ENCOUNTER_DAILY_LIMIT && dayPhase !== EncounterDayPhase.AWAITING_NEW_DAY) {
    dayPhase = EncounterDayPhase.ACTIVE;
  }
  if (count >= ENCOUNTER_DAILY_LIMIT && dayPhase === EncounterDayPhase.ACTIVE) {
    dayPhase = EncounterDayPhase.CONFIRMING_LIMIT;
  }
  const normalized = {
    date,
    key: typeof source.key === "string" ? source.key : "",
    count,
    clear: source.clear !== false,
    schemaVersion: 2,
    utcDay: utcDayKey(nowMs),
    dayPhase,
    anchorReason: validAnchors.has(source.anchorReason)
      ? source.anchorReason
      : date
        ? EncounterAnchorReason.ENCOUNTER_COMPLETED
        : null,
    invalidCycleCount:
      dayPhase === EncounterDayPhase.CONFIRMING_LIMIT ||
      dayPhase === EncounterDayPhase.STOPPED_FOR_DAY
        ? Math.min(ENCOUNTER_LIMIT_EMPTY_CYCLES, Math.max(0, Number(source.invalidCycleCount) || 0))
        : 0,
  };
  return carryGenerationSchedule(normalized, source, nowMs, ENCOUNTER_COOLDOWN_MS);
}

export function observeEncounterNewDay(state, nowMs = Date.now()) {
  const current = normalizeEncounterState(state, nowMs);
  if (current.anchorReason === EncounterAnchorReason.NEW_DAY) return current;
  if (current.dayPhase !== EncounterDayPhase.AWAITING_NEW_DAY && (current.date || current.count)) {
    return current;
  }
  return {
    ...defaultEncounterState(nowMs),
    date: nowMs,
    anchorReason: EncounterAnchorReason.NEW_DAY,
  };
}

export function markEncounterCompleted(state, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  next.date = nowMs;
  next.key = "";
  next.count = Math.min(ENCOUNTER_DAILY_LIMIT, next.count + 1);
  next.clear = true;
  next.dayPhase =
    next.count >= ENCOUNTER_DAILY_LIMIT
      ? EncounterDayPhase.CONFIRMING_LIMIT
      : EncounterDayPhase.ACTIVE;
  next.anchorReason = EncounterAnchorReason.ENCOUNTER_COMPLETED;
  next.invalidCycleCount = 0;
  return clearEncounterGenerationSchedule(next);
}

export function markEncounterProbeEmpty(state, reason, nowMs = Date.now(), attemptKey) {
  const next = normalizeEncounterState(state, nowMs);
  if (next.dayPhase === EncounterDayPhase.STOPPED_FOR_DAY) return next;
  clearGenerationRecovery(next);
  next.nextProbeAt = nowMs + ENCOUNTER_COOLDOWN_MS;
  next.probeReason = validProbeReasons.has(reason)
    ? reason
    : EncounterGenerationFailureReason.ENCOUNTER_KEY_MISSING;
  if (attemptKey) next.probeAttemptKey = String(attemptKey);
  return next;
}

export function markEncounterLimitProbeEmpty(state, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (next.dayPhase !== EncounterDayPhase.CONFIRMING_LIMIT) return next;
  next.date = nowMs;
  next.key = "";
  next.clear = true;
  next.anchorReason = EncounterAnchorReason.LIMIT_PROBE;
  next.invalidCycleCount = Math.min(ENCOUNTER_LIMIT_EMPTY_CYCLES, next.invalidCycleCount + 1);
  if (next.invalidCycleCount >= ENCOUNTER_LIMIT_EMPTY_CYCLES) {
    next.dayPhase = EncounterDayPhase.STOPPED_FOR_DAY;
  }
  return clearEncounterGenerationSchedule(next);
}
