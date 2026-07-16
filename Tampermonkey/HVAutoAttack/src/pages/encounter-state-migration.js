import { EncounterGenerationFailureReason } from "./encounter-generation-result.js";

const LEGACY_GENERATION_BACKOFF_MS = [5 * 60 * 1000, 15 * 60 * 1000];
const LEGACY_GENERATION_CIRCUIT_OPEN_MS = 60 * 60 * 1000;
const LEGACY_ABSENCE_REASONS = new Set([
  EncounterGenerationFailureReason.ENCOUNTER_KEY_MISSING,
  EncounterGenerationFailureReason.ENCOUNTER_KEY_ALREADY_ATTEMPTED,
]);

export const isLegacyEncounterAbsence = (reason) => LEGACY_ABSENCE_REASONS.has(String(reason));

function legacyFailureDeadline(state, nowMs, cooldownMs) {
  const probeDeadline = Math.max(0, Number(state?.nextProbeAt) || 0);
  if (probeDeadline) return probeDeadline;
  const circuitDeadline = Math.max(0, Number(state?.generationCircuitOpenUntil) || 0);
  if (circuitDeadline) {
    return Math.max(nowMs, circuitDeadline - LEGACY_GENERATION_CIRCUIT_OPEN_MS + cooldownMs);
  }
  const retryDeadline = Math.max(0, Number(state?.generationNextAttemptAt) || 0);
  if (!retryDeadline) return nowMs + cooldownMs;
  const failureCount = Math.max(1, Number(state?.generationFailureCount) || 1);
  const index = Math.min(failureCount - 1, LEGACY_GENERATION_BACKOFF_MS.length - 1);
  return Math.max(nowMs, retryDeadline - LEGACY_GENERATION_BACKOFF_MS[index] + cooldownMs);
}

export function migrateEncounterCycle(source, nowMs, cooldownMs, date, anchorReason) {
  let cycleReadyAt = Math.max(0, Number(source.cycleReadyAt) || 0);
  const failureReason = source.probeReason || source.generationFailureReason;
  if (source.nextProbeAt || isLegacyEncounterAbsence(failureReason)) {
    cycleReadyAt = legacyFailureDeadline(source, nowMs, cooldownMs);
    return {
      date: Math.max(0, cycleReadyAt - cooldownMs),
      cycleReadyAt,
      anchorReason: "encounterFailed",
    };
  }
  if (!cycleReadyAt && date) cycleReadyAt = date + cooldownMs;
  return { date, cycleReadyAt, anchorReason };
}

export function migrateGenerationRecoveryDeadline(state, nowMs, step, nextDelayMs) {
  const deadline = Math.max(
    0,
    Number(state?.generationCircuitOpenUntil) || Number(state?.generationNextAttemptAt) || 0
  );
  if (!deadline) return nowMs;
  const legacyDelay = state?.generationCircuitOpenUntil
    ? LEGACY_GENERATION_CIRCUIT_OPEN_MS
    : LEGACY_GENERATION_BACKOFF_MS[Math.min(step - 1, LEGACY_GENERATION_BACKOFF_MS.length - 1)];
  return Math.max(nowMs, deadline - legacyDelay + nextDelayMs);
}
