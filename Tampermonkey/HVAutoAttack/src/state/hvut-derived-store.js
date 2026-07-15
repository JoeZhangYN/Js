import {
  measureStorageLogicalBytes,
  runStorageIoMetricsAutomation,
  StorageIoMetricsEvent,
} from "./storage-io-metrics.js";
import { storageIoPolicyOf, StorageIdentity, StorageWriteOutcome } from "./storage-io-policy.js";
import { createHvutDerivedIndexedDbAdapter } from "./hvut-derived-store-indexeddb.js";
import { assembleHvutDerivedValue } from "./hvut-derived-value.js";
import {
  HVUT_DERIVED_STORE_FAILURE_KEY,
  recordHvutDerivedStoreFailure,
} from "./hvut-derived-store-failure.js";

export { HVUT_DERIVED_STORE_FAILURE_KEY };

export const HvutDerivedStoreEvent = Object.freeze({
  HYDRATE: "hydrate",
  READ: "read",
  WRITE: "write",
  RESET_RUNTIME: "resetRuntime",
});

const clone = (value) => (value === undefined ? undefined : structuredClone(value));

export function createHvutDerivedStoreCapability({ dbName, sourceIdentity, families }, deps = {}) {
  const policy = storageIoPolicyOf(StorageIdentity.HVUT_DERIVED_RECORD);
  const adapter =
    deps.adapter ||
    createHvutDerivedIndexedDbAdapter({ indexedDb: deps.indexedDb || indexedDB, dbName });
  const recordIo = deps.recordIo || runStorageIoMetricsAutomation;
  const cache = new Map();
  const queues = new Map();
  let hydrated = false;

  function observe(outcome, family, value) {
    recordIo({
      type: StorageIoMetricsEvent.RECORD,
      identity: policy.identity,
      outcome,
      logicalBytes: measureStorageLogicalBytes(family, value),
      sourceIdentity: `${sourceIdentity}:${family}`,
    });
  }

  async function hydrate() {
    try {
      const snapshot = await adapter.load();
      for (const family of families) {
        const meta = snapshot.meta.find((item) => item.family === family);
        if (!meta) continue;
        const records = snapshot.records.filter((item) => item.family === family);
        cache.set(family, assembleHvutDerivedValue(meta, records));
      }
      hydrated = true;
      return { outcome: StorageWriteOutcome.SKIPPED_POLICY };
    } catch (error) {
      hydrated = true;
      recordHvutDerivedStoreFailure("hydrate", null, error);
      return { outcome: StorageWriteOutcome.FAILED, error };
    }
  }

  function read(event) {
    if (!hydrated) throw new Error("HVUT derived storage must hydrate before reads");
    return cache.has(event.family) ? clone(cache.get(event.family)) : clone(event.fallback);
  }

  function write(event) {
    if (!families.includes(event.family)) {
      return Promise.resolve({ outcome: StorageWriteOutcome.SKIPPED_POLICY });
    }
    const value = clone(event.value);
    const prior = queues.get(event.family) || Promise.resolve();
    const next = prior.then(async () => {
      try {
        const result = await adapter.sync(event.family, value);
        cache.set(event.family, clone(value));
        observe(result.outcome, event.family, value);
        return result;
      } catch (error) {
        observe(StorageWriteOutcome.FAILED, event.family, value);
        recordHvutDerivedStoreFailure("write", event.family, error);
        return { outcome: StorageWriteOutcome.FAILED, error };
      }
    });
    queues.set(event.family, next);
    return next;
  }

  const handlers = Object.freeze({
    [HvutDerivedStoreEvent.HYDRATE]: hydrate,
    [HvutDerivedStoreEvent.READ]: read,
    [HvutDerivedStoreEvent.WRITE]: write,
    [HvutDerivedStoreEvent.RESET_RUNTIME]: () => {
      cache.clear();
      queues.clear();
      hydrated = false;
      return true;
    },
  });
  return Object.freeze({ run: (event) => handlers[event?.type]?.(event) });
}
