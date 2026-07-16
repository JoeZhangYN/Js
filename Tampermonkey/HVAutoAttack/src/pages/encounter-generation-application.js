import { isManualEncounterCheck, normalizeEncounterCheckMode } from "./encounter-check-mode.js";
import {
  EncounterDayPhase,
  markEncounterLimitProbeEmpty,
  normalizeEncounterState,
  observeEncounterNewDay,
} from "./encounter-day-state.js";
import { markEncounterKeyAvailable } from "./encounter-entry-state.js";
import {
  EncounterGenerationFailureReason,
  EncounterGenerationResultStatus,
} from "./encounter-generation-result.js";

export const EncounterGenerationApplication = Object.freeze({
  AVAILABLE: "available",
  AUTOMATIC_CHECK_FAILED: "automaticCheckFailed",
  BUSINESS_BLOCKED: "businessBlocked",
  LIMIT_PROBE_EMPTY: "limitProbeEmpty",
  MANUAL_CHECK_FAILED: "manualCheckFailed",
  MANUAL_EMPTY: "manualEmpty",
  NEW_DAY: "newDay",
});

function failedCheckApplication(current, result, checkMode) {
  return {
    application: isManualEncounterCheck(checkMode)
      ? EncounterGenerationApplication.MANUAL_CHECK_FAILED
      : EncounterGenerationApplication.AUTOMATIC_CHECK_FAILED,
    result,
    state: current,
  };
}

export function applyEncounterGenerationResult(state, result, event = {}) {
  const nowMs = event.nowMs ?? Date.now();
  const checkMode = normalizeEncounterCheckMode(event.checkMode);
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
    return failedCheckApplication(
      next,
      {
        status: EncounterGenerationResultStatus.UNAVAILABLE,
        reason: EncounterGenerationFailureReason.ENCOUNTER_KEY_ALREADY_ATTEMPTED,
        key: result.key,
      },
      checkMode
    );
  }
  const current = normalizeEncounterState(state, nowMs);
  if (result.reason === EncounterGenerationFailureReason.EQUIPMENT_INVENTORY_FULL) {
    return {
      application: EncounterGenerationApplication.BUSINESS_BLOCKED,
      result,
      state: current,
    };
  }
  if (
    !isManualEncounterCheck(checkMode) &&
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
    result.status === EncounterGenerationResultStatus.UNAVAILABLE &&
    isManualEncounterCheck(checkMode)
  ) {
    return {
      application: EncounterGenerationApplication.MANUAL_EMPTY,
      result,
      state: current,
    };
  }
  return failedCheckApplication(current, result, checkMode);
}
