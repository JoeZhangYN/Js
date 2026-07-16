import {
  BattleSessionCheckpointEvent,
  BattleSessionCheckpointSlice,
} from "../state/battle-session-checkpoint.js";
import { StorageWriteOutcome } from "../state/storage-io-policy.js";
import { normalizeBattleSessionSnapshot } from "./battle-session-state.js";

export function createBattleSessionId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

export function readBattleSession(deps) {
  const result = deps.checkpoint({
    type: BattleSessionCheckpointEvent.READ_SLICE,
    slice: BattleSessionCheckpointSlice.BATTLE_SESSION,
  });
  if (result?.kind === "absent") return { kind: "absent", snapshot: null };
  if (result?.kind !== "loaded") {
    deps.fail("read-checkpoint", { reason: result?.kind || "unknown" });
    return { kind: result?.kind || "unknown", snapshot: null };
  }
  const snapshot = normalizeBattleSessionSnapshot(result.checkpoint);
  if (snapshot) return { kind: "loaded", snapshot };
  deps.fail("decode-checkpoint", { reason: "invalidBattleSessionSnapshot" });
  return { kind: "corrupt", snapshot: null };
}

export function writeBattleSession(snapshot, deps) {
  const result = deps.checkpoint({
    type: BattleSessionCheckpointEvent.CHECKPOINT_SLICE,
    slice: BattleSessionCheckpointSlice.BATTLE_SESSION,
    value: snapshot,
    lifecycleBoundary: true,
  });
  if (result?.outcome !== StorageWriteOutcome.FAILED) return true;
  deps.fail("write-checkpoint", {
    reason: "battleSessionPersistenceFailed",
    error: result.error?.message || String(result.error || "unknown"),
  });
  return false;
}
