import { clearEncounterGenerationSchedule } from "./encounter-generation-recovery.js";
import {
  EncounterGenerationFailureReason,
  EncounterGenerationResultStatus,
} from "./encounter-generation-result.js";
import {
  EncounterDayPhase,
  markEncounterLimitProbeEmpty,
  markEncounterProbeEmpty,
  normalizeEncounterState,
  observeEncounterNewDay,
} from "./encounter-day-state.js";

export const EncounterGenerationApplication = Object.freeze({
  AVAILABLE: "available",
  FAILURE: "failure",
  LIMIT_PROBE_EMPTY: "limitProbeEmpty",
  NEW_DAY: "newDay",
  PROBE_EMPTY: "probeEmpty",
});

export function markEncounterKeyAvailable(state, key, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (!key || next.dayPhase === EncounterDayPhase.STOPPED_FOR_DAY) return next;
  if (next.key === key) return next;
  next.key = key;
  next.clear = false;
  return clearEncounterGenerationSchedule(next);
}

export function markEncounterAttempted(state, key, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (!key || next.key !== key) return next;
  next.clear = true;
  return next;
}

export function markEncounterEntryStarted(state, event = {}) {
  const nowMs = event.nowMs ?? Date.now();
  const next = normalizeEncounterState(state, nowMs);
  const key = event.key || event.parseKey?.(event.search || "");
  if (key && next.key === key) next.clear = true;
  if (event.source === "battleRoundStart" && next.key) next.clear = true;
  return next;
}

export function applyEncounterGenerationResult(state, result, nowMs = Date.now(), attemptKey) {
  if (result.status === EncounterGenerationResultStatus.NEW_DAY) {
    return {
      application: EncounterGenerationApplication.NEW_DAY,
      result,
      state: observeEncounterNewDay(state, nowMs),
    };
  }
  if (result.status === EncounterGenerationResultStatus.AVAILABLE) {
    const next = markEncounterKeyAvailable(state, result.key, nowMs);
    if (!next.clear) {
      return { application: EncounterGenerationApplication.AVAILABLE, result, state: next };
    }
    return {
      application: EncounterGenerationApplication.FAILURE,
      result: {
        status: EncounterGenerationResultStatus.UNAVAILABLE,
        reason: EncounterGenerationFailureReason.ENCOUNTER_KEY_ALREADY_ATTEMPTED,
        key: result.key,
      },
      state: next,
    };
  }
  const current = normalizeEncounterState(state, nowMs);
  if (
    result.reason === EncounterGenerationFailureReason.ENCOUNTER_KEY_MISSING &&
    current.dayPhase === EncounterDayPhase.CONFIRMING_LIMIT
  ) {
    return {
      application: EncounterGenerationApplication.LIMIT_PROBE_EMPTY,
      result,
      state: markEncounterLimitProbeEmpty(current, nowMs),
    };
  }
  if (
    result.reason === EncounterGenerationFailureReason.ENCOUNTER_KEY_MISSING ||
    result.reason === EncounterGenerationFailureReason.ENCOUNTER_KEY_ALREADY_ATTEMPTED
  ) {
    return {
      application: EncounterGenerationApplication.PROBE_EMPTY,
      result,
      state: markEncounterProbeEmpty(current, result.reason, nowMs, attemptKey),
    };
  }
  return { application: EncounterGenerationApplication.FAILURE, result, state: current };
}
