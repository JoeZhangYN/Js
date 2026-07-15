import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import {
  measureStorageLogicalBytes,
  runStorageIoMetricsAutomation,
  StorageIoMetricsEvent,
} from "./storage-io-metrics.js";
import { storageIoPolicyOf, StorageIdentity, StorageWriteOutcome } from "./storage-io-policy.js";

const EVENT_READ = "read";
const EVENT_CHECKPOINT = "checkpoint";
const EVENT_CLEAR = "clear";

export const BattleSessionCheckpointEvent = Object.freeze({
  READ: EVENT_READ,
  CHECKPOINT: EVENT_CHECKPOINT,
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

  function observe(outcome, logicalBytes) {
    recordIo({
      identity: policy.identity,
      outcome,
      logicalBytes,
      sourceIdentity,
    });
  }

  function read() {
    const raw = storage.getItem(key);
    if (raw === null) return Object.freeze({ kind: "absent" });
    try {
      return Object.freeze({ kind: "loaded", checkpoint: JSON.parse(raw) });
    } catch (error) {
      return Object.freeze({
        kind: "corrupt",
        failure: Object.freeze({ reason: "invalidJson", error: error?.message || String(error) }),
      });
    }
  }

  function checkpoint(event) {
    const logicalBytes = measureStorageLogicalBytes(key, event.checkpoint);
    const turn = Number(event.checkpoint?.globalTurn || 0);
    if (!event.lifecycleBoundary && turn % policy.budget.everyTurns !== 0) {
      observe(StorageWriteOutcome.SKIPPED_POLICY, logicalBytes);
      return Object.freeze({ outcome: StorageWriteOutcome.SKIPPED_POLICY });
    }
    const raw = JSON.stringify(event.checkpoint);
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
      if (storage.getItem(key) === null) {
        observe(StorageWriteOutcome.SKIPPED_UNCHANGED, logicalBytes);
        return Object.freeze({ outcome: StorageWriteOutcome.SKIPPED_UNCHANGED });
      }
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
      if (event?.type === EVENT_READ) return read();
      if (event?.type === EVENT_CHECKPOINT) return checkpoint(event);
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
