import {
  BattleSessionCheckpointEvent,
  runBattleSessionCheckpointAutomation,
} from "./battle-session-checkpoint.js";
import { delValue, getValue } from "./storage.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";
import { STORAGE_KEYS } from "./persist-keys.js";

export function normalizeGlobalTurn(value) {
  const turn = Number(value);
  return Number.isFinite(turn) && turn > 0 ? Math.trunc(turn) : 0;
}

export function normalizeSkillLastUsed(value, skillRegistry) {
  const source = value && typeof value === "object" ? value : {};
  const map = {};
  for (const code of Object.keys(skillRegistry)) {
    const turn = Number(source[code]);
    if (Number.isFinite(turn) && turn >= 0) map[code] = Math.trunc(turn);
  }
  return map;
}

function normalizedState(value, skillRegistry) {
  return {
    version: 1,
    globalTurn: normalizeGlobalTurn(value?.globalTurn),
    skillLastUsed: normalizeSkillLastUsed(value?.skillLastUsed, skillRegistry),
  };
}

export function loadCdRuntimeCheckpoint(skillRegistry) {
  const result = runBattleSessionCheckpointAutomation({
    type: BattleSessionCheckpointEvent.READ,
  });
  if (result?.kind === "loaded") {
    return { state: normalizedState(result.checkpoint, skillRegistry), failure: null };
  }

  const legacyTurn = getValue(STORAGE_KEYS.GLOBAL_TURN);
  const legacySkills = getValue(STORAGE_KEYS.SKILL_LAST_USED, true);
  const state = normalizedState(
    { globalTurn: legacyTurn, skillLastUsed: legacySkills },
    skillRegistry
  );
  const hasLegacy = legacyTurn !== null || legacySkills !== null;
  const failure = result?.kind === "corrupt" ? result.failure : null;
  if (!hasLegacy && !failure) return { state, failure: null };

  const checkpoint = persistCdRuntimeCheckpoint(state, true);
  if (checkpoint.outcome === StorageWriteOutcome.FAILED) {
    return { state, failure: checkpoint.error || new Error("checkpoint write failed") };
  }
  if (hasLegacy) {
    delValue(STORAGE_KEYS.GLOBAL_TURN);
    delValue(STORAGE_KEYS.SKILL_LAST_USED);
  }
  return { state, failure };
}

export function persistCdRuntimeCheckpoint(state, lifecycleBoundary = false) {
  return runBattleSessionCheckpointAutomation({
    type: BattleSessionCheckpointEvent.CHECKPOINT,
    checkpoint: { version: 1, ...state },
    lifecycleBoundary,
  });
}
