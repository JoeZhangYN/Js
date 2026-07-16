import {
  isLegacyEncounterAbsence,
  migrateGenerationRecoveryDeadline,
} from "./encounter-state-migration.js";
import { EncounterEntryPhase } from "./encounter-entry-identity.js";

const ENCOUNTER_GENERATION_BACKOFF_MS = [1 * 60 * 1000, 3 * 60 * 1000];
const ENCOUNTER_GENERATION_CIRCUIT_OPEN_MS = 5 * 60 * 1000;
const ENCOUNTER_GENERATION_STEPS_PER_CIRCUIT = 3;
const ENCOUNTER_GENERATION_MAX_CIRCUITS = 2;

const utcDayKey = (stamp) => new Date(stamp).toISOString().slice(0, 10);

export function buildGenerationAttemptKey(state, nowMs = Date.now()) {
  return `${utcDayKey(nowMs)}:${state.date}:${state.entry.phase}:${state.entry.key}`;
}

function recoveryPosition(failureCount) {
  const count = Math.min(
    ENCOUNTER_GENERATION_STEPS_PER_CIRCUIT * ENCOUNTER_GENERATION_MAX_CIRCUITS,
    Math.max(1, failureCount)
  );
  return {
    count,
    circuit: Math.ceil(count / ENCOUNTER_GENERATION_STEPS_PER_CIRCUIT),
    step: ((count - 1) % ENCOUNTER_GENERATION_STEPS_PER_CIRCUIT) + 1,
  };
}

export function carryGenerationRecovery(normalized, state, nowMs) {
  const failureReason = String(state?.generationFailureReason || "");
  const schemaVersion = Number(state?.schemaVersion);
  const legacy = !Number.isFinite(schemaVersion) || schemaVersion < 4;
  if (legacy && isLegacyEncounterAbsence(failureReason)) return normalized;
  const sourceAttemptKey = state?.generationAttemptKey ? String(state.generationAttemptKey) : "";
  if (!sourceAttemptKey || !sourceAttemptKey.startsWith(`${utcDayKey(nowMs)}:`)) return normalized;
  const attemptKey = buildGenerationAttemptKey(normalized, nowMs);
  const position = recoveryPosition(Math.max(1, Number(state?.generationFailureCount) || 1));
  const legacyRecovery = !Number.isFinite(schemaVersion) || schemaVersion < 3;
  const nextDelay =
    position.step === ENCOUNTER_GENERATION_STEPS_PER_CIRCUIT
      ? ENCOUNTER_GENERATION_CIRCUIT_OPEN_MS
      : ENCOUNTER_GENERATION_BACKOFF_MS[position.step - 1];
  const deadline = legacyRecovery
    ? migrateGenerationRecoveryDeadline(state, nowMs, position.step, nextDelay)
    : Math.max(
        0,
        Number(state?.generationCircuitOpenUntil) || Number(state?.generationNextAttemptAt) || 0
      );
  normalized.generationAttemptKey = attemptKey;
  normalized.generationFailureCount = position.count;
  normalized.generationRecoveryCircuit = position.circuit;
  normalized.generationRecoveryStep = position.step;
  normalized.generationFailureReason = failureReason || "generationRequestFailed";
  if (position.step === ENCOUNTER_GENERATION_STEPS_PER_CIRCUIT) {
    normalized.generationCircuitOpenUntil = deadline;
    normalized.generationCircuitTerminal = position.circuit >= ENCOUNTER_GENERATION_MAX_CIRCUITS;
  } else {
    normalized.generationNextAttemptAt = deadline;
  }
  return normalized;
}

export function clearGenerationRecovery(state) {
  delete state.generationAttemptKey;
  delete state.generationFailureCount;
  delete state.generationNextAttemptAt;
  delete state.generationCircuitOpenUntil;
  delete state.generationCircuitTerminal;
  delete state.generationRecoveryCircuit;
  delete state.generationRecoveryStep;
  delete state.generationFailureReason;
  return state;
}

export function isGenerationCircuitResponseDue(state, nowMs) {
  return Boolean(
    state.generationCircuitTerminal &&
    state.generationCircuitOpenUntil &&
    state.generationCircuitOpenUntil <= nowMs
  );
}

export function readGenerationRecovery(state, nowMs) {
  if (isGenerationCircuitResponseDue(state, nowMs)) {
    return {
      status: "responseDue",
      countdownMs: 0,
      reason: "generationCircuitResponse",
    };
  }
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
  if (
    state.entry.phase === EncounterEntryPhase.KEY_AVAILABLE ||
    state.entry.phase === EncounterEntryPhase.BATTLE_ACTIVE
  ) {
    return state;
  }
  if (state.generationCircuitTerminal) return state;
  const key = String(attemptKey || buildGenerationAttemptKey(state, nowMs));
  const previousCount =
    state.generationAttemptKey === key ? Math.max(0, Number(state.generationFailureCount) || 0) : 0;
  const position = recoveryPosition(previousCount + 1);
  state.generationAttemptKey = key;
  state.generationFailureCount = position.count;
  state.generationRecoveryCircuit = position.circuit;
  state.generationRecoveryStep = position.step;
  state.generationFailureReason = String(reason || "generationRequestFailed");
  if (position.step === ENCOUNTER_GENERATION_STEPS_PER_CIRCUIT) {
    state.generationCircuitOpenUntil = nowMs + ENCOUNTER_GENERATION_CIRCUIT_OPEN_MS;
    state.generationCircuitTerminal = position.circuit >= ENCOUNTER_GENERATION_MAX_CIRCUITS;
    delete state.generationNextAttemptAt;
  } else {
    state.generationNextAttemptAt = nowMs + ENCOUNTER_GENERATION_BACKOFF_MS[position.step - 1];
    delete state.generationCircuitOpenUntil;
    delete state.generationCircuitTerminal;
  }
  return state;
}
