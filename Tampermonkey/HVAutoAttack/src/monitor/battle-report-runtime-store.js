import {
  BattleSessionCheckpointEvent,
  BattleSessionCheckpointSlice,
  runBattleSessionCheckpointAutomation,
} from "../state/battle-session-checkpoint.js";
import { StorageWriteOutcome } from "../state/storage-io-policy.js";
import { recordBattleRecordArchiveFailure } from "./battle-record-archive-failure.js";

export const BattleReportCheckpointMode = Object.freeze({
  MEMORY_ONLY: "memoryOnly",
  ROUND_BOUNDARY: "roundBoundary",
});

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function emptyState() {
  return { version: 1, sessionId: null, code: null, drop: null, usage: null };
}

export function createBattleReportRuntimeStore(deps = {}) {
  const runCheckpoint = deps.runCheckpoint || runBattleSessionCheckpointAutomation;
  const randomId =
    deps.randomId ||
    (() => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-battle`);
  const loaded = runCheckpoint({
    type: BattleSessionCheckpointEvent.READ_SLICE,
    slice: BattleSessionCheckpointSlice.BATTLE_REPORT,
  });
  let state = loaded?.kind === "loaded" ? clone(loaded.checkpoint) : emptyState();

  function publish(mode) {
    const event = {
      type:
        mode === BattleReportCheckpointMode.ROUND_BOUNDARY
          ? BattleSessionCheckpointEvent.CHECKPOINT_SLICE
          : BattleSessionCheckpointEvent.UPDATE_SLICE,
      slice: BattleSessionCheckpointSlice.BATTLE_REPORT,
      value: clone(state),
      lifecycleBoundary: mode === BattleReportCheckpointMode.ROUND_BOUNDARY,
    };
    const result = runCheckpoint(event);
    if (result?.outcome === StorageWriteOutcome.FAILED) {
      recordBattleRecordArchiveFailure("runtime-checkpoint", "battleReport", result.error);
    }
    return result;
  }

  function ensureSession() {
    if (!state.sessionId) state.sessionId = randomId();
  }

  function refreshState() {
    const current = runCheckpoint({
      type: BattleSessionCheckpointEvent.READ_SLICE,
      slice: BattleSessionCheckpointSlice.BATTLE_REPORT,
    });
    if (current?.kind === "loaded") state = clone(current.checkpoint);
  }

  return Object.freeze({
    start({ enabled, code }) {
      if (!enabled || state.code) return false;
      ensureSession();
      state.code = code;
      return (
        publish(BattleReportCheckpointMode.ROUND_BOUNDARY).outcome !== StorageWriteOutcome.FAILED
      );
    },
    readCode: () => state.code,
    readCurrent: (family) => clone(state[family]),
    readOrCreate(family, defaultRecord) {
      return clone(state[family] || defaultRecord);
    },
    store(family, record, mode) {
      ensureSession();
      state[family] = clone(record);
      return publish(mode);
    },
    archiveIdentity(family) {
      ensureSession();
      return { id: `${state.sessionId}:${family}`, code: state.code, createdAt: Date.now() };
    },
    clearFamily(family) {
      refreshState();
      state[family] = null;
      if (!state.drop && !state.usage) {
        state.code = null;
        state.sessionId = null;
      }
      return publish(BattleReportCheckpointMode.ROUND_BOUNDARY);
    },
  });
}
