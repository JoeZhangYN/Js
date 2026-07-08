const ENCOUNTER_GENERATION_BACKOFF_MS = [5 * 60 * 1000, 15 * 60 * 1000];
const ENCOUNTER_GENERATION_CIRCUIT_THRESHOLD = 3;
const ENCOUNTER_GENERATION_CIRCUIT_OPEN_MS = 60 * 60 * 1000;

const utcDayKey = (stamp) => new Date(stamp).toISOString().slice(0, 10);

export function buildGenerationAttemptKey(state, nowMs = Date.now(), status = "ready") {
  return `${utcDayKey(nowMs)}:${state.date}:${state.key}:${state.clear}:${status}`;
}

export function carryGenerationRecovery(normalized, state, nowMs) {
  const attemptKey = state?.generationAttemptKey ? String(state.generationAttemptKey) : "";
  if (!attemptKey || !attemptKey.startsWith(`${utcDayKey(nowMs)}:`)) return normalized;
  normalized.generationAttemptKey = attemptKey;
  normalized.generationFailureCount = Math.max(0, Number(state?.generationFailureCount) || 0);
  normalized.generationNextAttemptAt = Math.max(0, Number(state?.generationNextAttemptAt) || 0);
  normalized.generationCircuitOpenUntil = Math.max(
    0,
    Number(state?.generationCircuitOpenUntil) || 0
  );
  if (state?.generationFailureReason) {
    normalized.generationFailureReason = String(state.generationFailureReason);
  }
  return normalized;
}

export function clearGenerationRecovery(state) {
  delete state.generationAttemptKey;
  delete state.generationFailureCount;
  delete state.generationNextAttemptAt;
  delete state.generationCircuitOpenUntil;
  delete state.generationFailureReason;
  return state;
}

export function readGenerationRecovery(state, nowMs) {
  if (state.generationCircuitOpenUntil > nowMs) {
    return {
      status: "countdown",
      countdownMs: state.generationCircuitOpenUntil - nowMs,
      reason: "generationCircuitOpen",
    };
  }
  if (state.generationNextAttemptAt > nowMs) {
    return {
      status: "countdown",
      countdownMs: state.generationNextAttemptAt - nowMs,
      reason: "generationBackoff",
    };
  }
  return null;
}

export function markEncounterGenerationAttempted(
  state,
  attemptKey,
  nowMs = Date.now(),
  reason = "encounterKeyMissing"
) {
  if (state.key && !state.clear) return state;
  state.clear = true;
  const key = String(attemptKey || buildGenerationAttemptKey(state, nowMs, "ready"));
  const previousCount = state.generationAttemptKey === key
    ? Math.max(0, Number(state.generationFailureCount) || 0)
    : 0;
  const failureCount = previousCount + 1;
  state.generationAttemptKey = key;
  state.generationFailureCount = failureCount;
  state.generationFailureReason = String(reason || "encounterKeyMissing");
  if (failureCount >= ENCOUNTER_GENERATION_CIRCUIT_THRESHOLD) {
    state.generationCircuitOpenUntil = nowMs + ENCOUNTER_GENERATION_CIRCUIT_OPEN_MS;
    delete state.generationNextAttemptAt;
  } else {
    const index = Math.min(failureCount - 1, ENCOUNTER_GENERATION_BACKOFF_MS.length - 1);
    state.generationNextAttemptAt = nowMs + ENCOUNTER_GENERATION_BACKOFF_MS[index];
    delete state.generationCircuitOpenUntil;
  }
  return state;
}
