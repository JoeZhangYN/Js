import { roundRuntime } from "./battle-round-runtime.js";

export const BattleSessionPhase = Object.freeze({
  ACTIVE: "active",
  TERMINAL: "terminal",
});

export const BattleSessionIdentitySource = Object.freeze({
  INITIALIZATION_LOG: "initializationLog",
  DEBUG_OVERRIDE: "debugOverride",
});

const validPhases = new Set(Object.values(BattleSessionPhase));
const validSources = new Set(Object.values(BattleSessionIdentitySource));

export function classifyBattleRoundType(initializingText = "") {
  if (!initializingText.startsWith("Initializing")) return "";
  const arenaMatch = initializingText.match(/^Initializing arena challenge.*?(\d+)/);
  if (arenaMatch && Number(arenaMatch[1]) <= 35) return "ar";
  if (arenaMatch && Number(arenaMatch[1]) >= 105) return "rb";
  if (/^Initializing random encounter/.test(initializingText)) return "ba";
  if (/^Initializing Item World/.test(initializingText)) return "iw";
  if (/^Initializing Grindfest/.test(initializingText)) return "gr";
  if (/^Initializing The Tower/.test(initializingText)) return "tw";
  return "";
}

export function isBattleInitialization(initializingText = "") {
  return initializingText.startsWith("Initializing");
}

export function createBattleSessionSnapshot(sessionId, roundType, source) {
  if (!sessionId || !roundType || !validSources.has(source)) return null;
  return {
    version: 1,
    sessionId,
    phase: BattleSessionPhase.ACTIVE,
    identity: { roundType, source },
    progress: roundRuntime(1, 1),
  };
}

export function normalizeBattleSessionSnapshot(value) {
  if (!value || value.version !== 1 || !value.sessionId) return null;
  if (!validPhases.has(value.phase) || !value.identity?.roundType) return null;
  if (!validSources.has(value.identity.source)) return null;
  const snapshot = {
    version: 1,
    sessionId: String(value.sessionId),
    phase: value.phase,
    identity: {
      roundType: String(value.identity.roundType),
      source: value.identity.source,
    },
    progress: roundRuntime(value.progress?.roundNow, value.progress?.roundAll),
  };
  if (value.phase === BattleSessionPhase.TERMINAL) snapshot.outcome = value.outcome;
  return snapshot;
}

export function recordBattleSessionProgress(snapshot, roundNow, roundAll) {
  const current = normalizeBattleSessionSnapshot(snapshot);
  if (!current || current.phase !== BattleSessionPhase.ACTIVE) return null;
  return { ...current, progress: roundRuntime(roundNow, roundAll) };
}

export function markBattleSessionTerminal(snapshot, outcome) {
  const current = normalizeBattleSessionSnapshot(snapshot);
  if (!current || current.phase !== BattleSessionPhase.ACTIVE) return null;
  return { ...current, phase: BattleSessionPhase.TERMINAL, outcome };
}

export function readStartProgress(initializingText, roundType) {
  const match = String(initializingText || "").match(/\(Round (\d+) \/ (\d+)\)/);
  if (roundType !== "ba" && match) return roundRuntime(match[1], match[2]);
  return roundRuntime(1, 1);
}
