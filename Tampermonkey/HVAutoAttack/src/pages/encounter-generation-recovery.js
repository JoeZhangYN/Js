import { EncounterGenerationFailureReason } from "./encounter-generation-result.js";

const ENCOUNTER_GENERATION_BACKOFF_MS = [5 * 60 * 1000, 15 * 60 * 1000];
const ENCOUNTER_GENERATION_CIRCUIT_THRESHOLD = 3;
const ENCOUNTER_GENERATION_CIRCUIT_OPEN_MS = 60 * 60 * 1000;
const ENCOUNTER_PROBE_ABSENCE_REASONS = new Set([
  EncounterGenerationFailureReason.ENCOUNTER_KEY_MISSING,
  EncounterGenerationFailureReason.ENCOUNTER_KEY_ALREADY_ATTEMPTED,
]);

const utcDayKey = (stamp) => new Date(stamp).toISOString().slice(0, 10);

export function buildGenerationAttemptKey(state, nowMs = Date.now(), status = "ready") {
  return `${utcDayKey(nowMs)}:${state.date}:${state.key}:${state.clear}:${status}`;
}

function legacyProbeDeadline(state, nowMs, cooldownMs) {
  const circuitOpenUntil = Math.max(0, Number(state?.generationCircuitOpenUntil) || 0);
  if (circuitOpenUntil) {
    return Math.max(nowMs, circuitOpenUntil - ENCOUNTER_GENERATION_CIRCUIT_OPEN_MS + cooldownMs);
  }
  const nextAttemptAt = Math.max(0, Number(state?.generationNextAttemptAt) || 0);
  if (!nextAttemptAt) return nowMs + cooldownMs;
  const failureCount = Math.max(1, Number(state?.generationFailureCount) || 1);
  const index = Math.min(failureCount - 1, ENCOUNTER_GENERATION_BACKOFF_MS.length - 1);
  return Math.max(nowMs, nextAttemptAt - ENCOUNTER_GENERATION_BACKOFF_MS[index] + cooldownMs);
}

export function carryGenerationSchedule(normalized, state, nowMs, cooldownMs) {
  const nextProbeAt = Math.max(0, Number(state?.nextProbeAt) || 0);
  if (nextProbeAt) {
    normalized.nextProbeAt = nextProbeAt;
    normalized.probeReason = String(
      state?.probeReason || EncounterGenerationFailureReason.ENCOUNTER_KEY_MISSING
    );
    if (state?.probeAttemptKey) normalized.probeAttemptKey = String(state.probeAttemptKey);
    return normalized;
  }
  const failureReason = String(state?.generationFailureReason || "");
  if (ENCOUNTER_PROBE_ABSENCE_REASONS.has(failureReason)) {
    normalized.nextProbeAt = nextProbeAt || legacyProbeDeadline(state, nowMs, cooldownMs);
    normalized.probeReason = failureReason;
    if (!normalized.probeAttemptKey && state?.generationAttemptKey) {
      normalized.probeAttemptKey = String(state.generationAttemptKey);
    }
    return normalized;
  }
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

export function clearEncounterProbeSchedule(state) {
  delete state.nextProbeAt;
  delete state.probeReason;
  delete state.probeAttemptKey;
  return state;
}

export function clearEncounterGenerationSchedule(state) {
  return clearEncounterProbeSchedule(clearGenerationRecovery(state));
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

export function markEncounterGenerationFailed(
  state,
  attemptKey,
  nowMs = Date.now(),
  reason = "generationRequestFailed"
) {
  if (state.key && !state.clear) return state;
  clearEncounterProbeSchedule(state);
  state.clear = true;
  const key = String(attemptKey || buildGenerationAttemptKey(state, nowMs, "ready"));
  const previousCount =
    state.generationAttemptKey === key ? Math.max(0, Number(state.generationFailureCount) || 0) : 0;
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
