import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import {
  measureStorageLogicalBytes,
  runStorageIoMetricsAutomation,
  StorageIoMetricsEvent,
} from "./storage-io-metrics.js";
import { storageIoPolicyOf, StorageIdentity, StorageWriteOutcome } from "./storage-io-policy.js";
import { recordStaminaLossLogFailure } from "./stamina-loss-log-failure.js";
import { createStaminaLossIndexedDbAdapter } from "./stamina-loss-store-indexeddb.js";

export const StaminaLossStoreEvent = Object.freeze({
  APPEND: "append",
  LIST: "list",
  CLEAR: "clear",
});

export function createStaminaLossStoreCapability({ dbName, sourceIdentity }, deps = {}) {
  const policy = storageIoPolicyOf(StorageIdentity.STAMINA_LOSS);
  const adapter =
    deps.adapter ||
    createStaminaLossIndexedDbAdapter({
      dbName,
      indexedDb: deps.indexedDb || globalThis.indexedDB,
    });
  const recordIo = deps.recordIo || runStorageIoMetricsAutomation;
  const now = deps.now || Date.now;

  function observe(outcome, value) {
    recordIo({
      type: StorageIoMetricsEvent.RECORD,
      identity: policy.identity,
      outcome,
      logicalBytes: measureStorageLogicalBytes(dbName, value),
      sourceIdentity,
    });
  }

  async function append(event) {
    const record = {
      id: event.stamp,
      stamp: event.stamp,
      amount: Number(event.amount) || 0,
      observedAt: now(),
    };
    try {
      const result = await adapter.append(record, policy.budget, now());
      observe(result.outcome, record);
      return result;
    } catch (error) {
      observe(StorageWriteOutcome.FAILED, record);
      recordStaminaLossLogFailure("append", error);
      return { outcome: StorageWriteOutcome.FAILED, error };
    }
  }

  async function list() {
    try {
      return await adapter.list();
    } catch (error) {
      recordStaminaLossLogFailure("read", error);
      return [];
    }
  }

  async function clear() {
    try {
      const result = await adapter.clear();
      observe(result.outcome, undefined);
      return result;
    } catch (error) {
      observe(StorageWriteOutcome.FAILED, undefined);
      recordStaminaLossLogFailure("clear", error);
      return { outcome: StorageWriteOutcome.FAILED, error };
    }
  }

  const handlers = Object.freeze({
    [StaminaLossStoreEvent.APPEND]: append,
    [StaminaLossStoreEvent.LIST]: list,
    [StaminaLossStoreEvent.CLEAR]: clear,
  });
  return Object.freeze({ run: (event) => handlers[event?.type]?.(event) });
}

const currentStaminaLossStore = createStaminaLossStoreCapability({
  ...CURRENT_WORLD_POLICY.staminaLoss,
  sourceIdentity: CURRENT_WORLD_POLICY.auditIdentity,
});
export function runStaminaLossStoreAutomation(event) {
  return currentStaminaLossStore.run(event);
}
