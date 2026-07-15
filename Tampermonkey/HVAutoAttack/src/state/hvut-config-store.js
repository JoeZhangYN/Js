import {
  measureStorageLogicalBytes,
  runStorageIoMetricsAutomation,
  StorageIoMetricsEvent,
} from "./storage-io-metrics.js";
import { StorageIdentity, StorageWriteOutcome } from "./storage-io-policy.js";
import { deleteStorageValue, writeCanonicalStorageValue } from "./storage-write-adapter.js";

export function createHvutConfigStoreCapability({ namespace, sourceIdentity }, deps = {}) {
  const prefix = `${namespace}_`;
  const gmGet = deps.gmGetValue || globalThis.GM_getValue;
  const gmSet = deps.gmSetValue || globalThis.GM_setValue;
  const gmDelete = deps.gmDeleteValue || globalThis.GM_deleteValue;
  const recordIo = deps.recordIo || runStorageIoMetricsAutomation;

  function observe(key, value, outcome) {
    recordIo({
      type: StorageIoMetricsEvent.RECORD,
      identity: StorageIdentity.HVUT_CONFIG,
      outcome,
      logicalBytes: measureStorageLogicalBytes(key, value),
      sourceIdentity,
    });
  }

  function read(key, fallback) {
    try {
      const value = gmGet(prefix + key);
      return value === undefined ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    const storageKey = prefix + key;
    try {
      const result = writeCanonicalStorageValue({ key: storageKey, value, gmSet, gmGet });
      observe(storageKey, result.canonicalValue, result.outcome);
      return result.outcome;
    } catch {
      observe(storageKey, value, StorageWriteOutcome.FAILED);
      return StorageWriteOutcome.FAILED;
    }
  }

  function remove(key) {
    const storageKey = prefix + key;
    try {
      const outcome = deleteStorageValue({ key: storageKey, gmDelete, gmGet });
      observe(storageKey, undefined, outcome);
      return outcome;
    } catch {
      observe(storageKey, undefined, StorageWriteOutcome.FAILED);
      return StorageWriteOutcome.FAILED;
    }
  }

  return Object.freeze({ read, write, remove });
}
