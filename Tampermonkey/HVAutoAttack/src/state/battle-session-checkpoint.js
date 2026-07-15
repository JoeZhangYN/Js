import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import {
  measureStorageLogicalBytes,
  runStorageIoMetricsAutomation,
  StorageIoMetricsEvent,
} from "./storage-io-metrics.js";
import { storageIoPolicyOf, StorageIdentity, StorageWriteOutcome } from "./storage-io-policy.js";
import {
  BattleSessionCheckpointSlice,
  clearBattleSessionCheckpointSlice,
  decodeBattleSessionCheckpoint,
  emptyBattleSessionCheckpoint,
  updateBattleSessionCheckpointSlice,
} from "./battle-session-checkpoint-state.js";

const EVENT_READ = "read";
const EVENT_READ_SLICE = "readSlice";
const EVENT_UPDATE_SLICE = "updateSlice";
const EVENT_CHECKPOINT = "checkpoint";
const EVENT_CHECKPOINT_SLICE = "checkpointSlice";
const EVENT_CLEAR_SLICE = "clearSlice";
const EVENT_CLEAR = "clear";

export { BattleSessionCheckpointSlice };
export const BattleSessionCheckpointEvent = Object.freeze({
  READ: EVENT_READ,
  READ_SLICE: EVENT_READ_SLICE,
  UPDATE_SLICE: EVENT_UPDATE_SLICE,
  CHECKPOINT: EVENT_CHECKPOINT,
  CHECKPOINT_SLICE: EVENT_CHECKPOINT_SLICE,
  CLEAR_SLICE: EVENT_CLEAR_SLICE,
  CLEAR: EVENT_CLEAR,
});

export function createBattleSessionCheckpointCapability({ sourceIdentity }, ports = {}) {
  if (!sourceIdentity) throw new TypeError("Battle session checkpoint requires source identity");
  const key = `HVAA:battleRuntimeCheckpoint:v1:${sourceIdentity}`;
  const policy = storageIoPolicyOf(StorageIdentity.SESSION_RUNTIME_CHECKPOINT);
  const storage = ports.sessionStorage || globalThis.sessionStorage;
  const recordIo =
    ports.recordIo ||
    ((event) => runStorageIoMetricsAutomation({ type: StorageIoMetricsEvent.RECORD, ...event }));
  let cached = null;
  let loadFailure = null;

  function observe(outcome, logicalBytes) {
    recordIo({ identity: policy.identity, outcome, logicalBytes, sourceIdentity });
  }

  function load() {
    if (cached) return cached;
    const raw = storage.getItem(key);
    if (raw === null) {
      cached = emptyBattleSessionCheckpoint();
      return cached;
    }
    try {
      cached = decodeBattleSessionCheckpoint(raw);
    } catch (error) {
      loadFailure = Object.freeze({
        reason: "invalidJson",
        error: error?.message || String(error),
      });
      cached = emptyBattleSessionCheckpoint();
    }
    return cached;
  }

  function readSlice(slice) {
    const value = load().slices[slice];
    if (value !== undefined) return Object.freeze({ kind: "loaded", checkpoint: value });
    if (loadFailure) return Object.freeze({ kind: "corrupt", failure: loadFailure });
    return Object.freeze({ kind: "absent" });
  }

  function updateSlice(slice, value) {
    cached = updateBattleSessionCheckpointSlice(load(), slice, value);
    return Object.freeze({ outcome: StorageWriteOutcome.SKIPPED_POLICY });
  }

  function persist(globalTurn, lifecycleBoundary) {
    const value = load();
    const logicalBytes = measureStorageLogicalBytes(key, value);
    const turn = Number(globalTurn || value.slices.cdRuntime?.globalTurn || 0);
    if (!lifecycleBoundary && turn % policy.budget.everyTurns !== 0) {
      observe(StorageWriteOutcome.SKIPPED_POLICY, logicalBytes);
      return Object.freeze({ outcome: StorageWriteOutcome.SKIPPED_POLICY });
    }
    const raw = JSON.stringify(value);
    try {
      if (storage.getItem(key) === raw) {
        observe(StorageWriteOutcome.SKIPPED_UNCHANGED, logicalBytes);
        return Object.freeze({ outcome: StorageWriteOutcome.SKIPPED_UNCHANGED });
      }
      storage.setItem(key, raw);
      observe(StorageWriteOutcome.WRITTEN, logicalBytes);
      return Object.freeze({ outcome: StorageWriteOutcome.WRITTEN });
    } catch (error) {
      observe(StorageWriteOutcome.FAILED, logicalBytes);
      return Object.freeze({ outcome: StorageWriteOutcome.FAILED, error });
    }
  }

  function clear() {
    const logicalBytes = measureStorageLogicalBytes(key, undefined);
    try {
      const present = storage.getItem(key) !== null;
      cached = emptyBattleSessionCheckpoint();
      loadFailure = null;
      if (!present) return Object.freeze({ outcome: StorageWriteOutcome.SKIPPED_UNCHANGED });
      storage.removeItem(key);
      observe(StorageWriteOutcome.DELETED, logicalBytes);
      return Object.freeze({ outcome: StorageWriteOutcome.DELETED });
    } catch (error) {
      observe(StorageWriteOutcome.FAILED, logicalBytes);
      return Object.freeze({ outcome: StorageWriteOutcome.FAILED, error });
    }
  }

  return Object.freeze({
    key,
    run(event = { type: EVENT_READ }) {
      if (event?.type === EVENT_READ) return readSlice(BattleSessionCheckpointSlice.CD_RUNTIME);
      if (event?.type === EVENT_READ_SLICE) return readSlice(event.slice);
      if (event?.type === EVENT_UPDATE_SLICE) return updateSlice(event.slice, event.value);
      if (event?.type === EVENT_CHECKPOINT) {
        updateSlice(BattleSessionCheckpointSlice.CD_RUNTIME, event.checkpoint);
        return persist(event.checkpoint?.globalTurn, event.lifecycleBoundary);
      }
      if (event?.type === EVENT_CHECKPOINT_SLICE) {
        updateSlice(event.slice, event.value);
        return persist(event.globalTurn, event.lifecycleBoundary);
      }
      if (event?.type === EVENT_CLEAR_SLICE) {
        cached = clearBattleSessionCheckpointSlice(load(), event.slice);
        return persist(event.globalTurn, true);
      }
      if (event?.type === EVENT_CLEAR) return clear();
      return undefined;
    },
  });
}

const currentBattleSessionCheckpoint = createBattleSessionCheckpointCapability({
  sourceIdentity: CURRENT_WORLD_POLICY.auditIdentity,
});

export const BATTLE_SESSION_CHECKPOINT_KEY = currentBattleSessionCheckpoint.key;
export function runBattleSessionCheckpointAutomation(event = { type: EVENT_READ }) {
  return currentBattleSessionCheckpoint.run(event);
}
