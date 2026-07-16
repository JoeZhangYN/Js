import {
  carryGenerationRecovery,
  clearGenerationRecovery,
  isGenerationCircuitResponseDue,
} from "./encounter-generation-recovery.js";
import { migrateEncounterCycle } from "./encounter-state-migration.js";

export const ENCOUNTER_DAILY_LIMIT = 24;
export const ENCOUNTER_BASE_COOLDOWN_MS = 30 * 60 * 1000;
export const ENCOUNTER_COOLDOWN_MS = ENCOUNTER_BASE_COOLDOWN_MS + 5000;
export const ENCOUNTER_CIRCUIT_JITTER_SECONDS = 30;
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
  ENCOUNTER_FAILED: "encounterFailed",
  CIRCUIT_RESPONSE: "circuitResponse",
});

const validPhases = new Set(Object.values(EncounterDayPhase));
const validAnchors = new Set(Object.values(EncounterAnchorReason));
const utcDayKey = (stamp) => new Date(stamp).toISOString().slice(0, 10);

export function defaultEncounterState(nowMs = Date.now()) {
  return {
    date: 0,
    cycleReadyAt: 0,
    key: "",
    count: 0,
    clear: true,
    schemaVersion: 3,
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
  const anchorReason = validAnchors.has(source.anchorReason)
    ? source.anchorReason
    : date
      ? EncounterAnchorReason.ENCOUNTER_COMPLETED
      : null;
  const cycle = migrateEncounterCycle(source, nowMs, ENCOUNTER_COOLDOWN_MS, date, anchorReason);
  const normalized = {
    ...cycle,
    key: typeof source.key === "string" ? source.key : "",
    count,
    clear: source.clear !== false,
    schemaVersion: 3,
    utcDay: utcDayKey(nowMs),
    dayPhase,
    invalidCycleCount:
      dayPhase === EncounterDayPhase.CONFIRMING_LIMIT ||
      dayPhase === EncounterDayPhase.STOPPED_FOR_DAY
        ? Math.min(ENCOUNTER_LIMIT_EMPTY_CYCLES, Math.max(0, Number(source.invalidCycleCount) || 0))
        : 0,
  };
  return carryGenerationRecovery(normalized, source, nowMs);
}

function anchorEncounterCycle(state, nowMs, anchorReason, cooldownMs = ENCOUNTER_COOLDOWN_MS) {
  state.date = nowMs;
  state.cycleReadyAt = nowMs + cooldownMs;
  state.anchorReason = anchorReason;
  return clearGenerationRecovery(state);
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
    cycleReadyAt: nowMs + ENCOUNTER_COOLDOWN_MS,
    anchorReason: EncounterAnchorReason.NEW_DAY,
  };
}

export function markEncounterCompleted(state, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  next.key = "";
  next.count = Math.min(ENCOUNTER_DAILY_LIMIT, next.count + 1);
  next.clear = true;
  next.dayPhase =
    next.count >= ENCOUNTER_DAILY_LIMIT
      ? EncounterDayPhase.CONFIRMING_LIMIT
      : EncounterDayPhase.ACTIVE;
  next.invalidCycleCount = 0;
  return anchorEncounterCycle(next, nowMs, EncounterAnchorReason.ENCOUNTER_COMPLETED);
}

export function markEncounterFailed(state, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (next.dayPhase === EncounterDayPhase.STOPPED_FOR_DAY) return next;
  next.clear = true;
  return anchorEncounterCycle(next, nowMs, EncounterAnchorReason.ENCOUNTER_FAILED);
}

export function markEncounterLimitProbeEmpty(state, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (next.dayPhase !== EncounterDayPhase.CONFIRMING_LIMIT) return next;
  next.key = "";
  next.clear = true;
  next.invalidCycleCount = Math.min(ENCOUNTER_LIMIT_EMPTY_CYCLES, next.invalidCycleCount + 1);
  if (next.invalidCycleCount >= ENCOUNTER_LIMIT_EMPTY_CYCLES) {
    next.dayPhase = EncounterDayPhase.STOPPED_FOR_DAY;
  }
  return anchorEncounterCycle(next, nowMs, EncounterAnchorReason.ENCOUNTER_FAILED);
}

export function resolveEncounterGenerationCircuit(state, nowMs = Date.now(), random = Math.random) {
  const next = normalizeEncounterState(state, nowMs);
  if (!isGenerationCircuitResponseDue(next, nowMs)) return next;
  const sample = Math.min(0.999999, Math.max(0, Number(random?.()) || 0));
  const jitterMs = Math.floor(sample * ENCOUNTER_CIRCUIT_JITTER_SECONDS) * 1000;
  return anchorEncounterCycle(
    next,
    nowMs,
    EncounterAnchorReason.CIRCUIT_RESPONSE,
    ENCOUNTER_BASE_COOLDOWN_MS + jitterMs
  );
}
