import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import {
  measureStorageLogicalBytes,
  runStorageIoMetricsAutomation,
  StorageIoMetricsEvent,
} from "./storage-io-metrics.js";
import { storageIoPolicyOf, StorageIdentity, StorageWriteOutcome } from "./storage-io-policy.js";
import { createLearnedMonsterIndexedDbAdapter } from "./learned-monster-store-indexeddb.js";
import { storageValueFingerprint } from "./storage-value.js";
import {
  LEARNED_MONSTER_STORE_FAILURE_KEY,
  recordLearnedMonsterStoreFailure,
} from "./learned-monster-store-failure.js";

export { LEARNED_MONSTER_STORE_FAILURE_KEY };
export const LearnedMonsterFamily = Object.freeze({
  BIG_KILL: "bigKill",
  INCOMING_BURST: "incomingBurst",
});
export const LearnedMonsterStoreEvent = Object.freeze({
  HYDRATE: "hydrate",
  READ_MAP: "readMap",
  READ_RECORDS: "readRecords",
  UPSERT_MANY: "upsertMany",
  RESET_RUNTIME: "resetRuntime",
});

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

export function createLearnedMonsterStoreCapability({ dbName, sourceIdentity }, deps = {}) {
  const policy = storageIoPolicyOf(StorageIdentity.LEARNED_MONSTER_IDENTITY);
  const adapter =
    deps.adapter ||
    createLearnedMonsterIndexedDbAdapter({
      dbName,
      indexedDb: deps.indexedDb || globalThis.indexedDB,
    });
  const recordIo = deps.recordIo || runStorageIoMetricsAutomation;
  const now = deps.now || Date.now;
  const caches = new Map();

  function cache(family) {
    if (!caches.has(family)) caches.set(family, new Map());
    return caches.get(family);
  }

  function observe(outcome, family, value) {
    recordIo({
      type: StorageIoMetricsEvent.RECORD,
      identity: policy.identity,
      outcome,
      logicalBytes: measureStorageLogicalBytes(family, value),
      sourceIdentity: `${sourceIdentity}:${family}`,
    });
  }

  async function hydrate(event) {
    try {
      const records = await adapter.list(event.family);
      for (const record of records) cache(event.family).set(record.id, record.value);
      return { outcome: StorageWriteOutcome.SKIPPED_POLICY, rows: cache(event.family).size };
    } catch (error) {
      recordLearnedMonsterStoreFailure("hydrate", event.family, error);
      return { outcome: StorageWriteOutcome.FAILED, error };
    }
  }

  async function readRecords(event) {
    try {
      return await adapter.list(event.family);
    } catch (error) {
      recordLearnedMonsterStoreFailure("readRecords", event.family, error);
      return { outcome: StorageWriteOutcome.FAILED, error };
    }
  }

  function readMap(event) {
    return Object.fromEntries([...cache(event.family)].map(([id, value]) => [id, clone(value)]));
  }

  async function upsertMany(event) {
    const target = cache(event.family);
    const previous = new Map(
      event.records.map(({ id }) => [
        String(id),
        target.has(String(id)) ? clone(target.get(String(id))) : null,
      ])
    );
    const envelopes = event.records.map(({ id, value }) => ({
      id: String(id),
      value: clone(value),
      lastUsed: now(),
      ...(event.migrationSourceId ? { migrationSourceId: event.migrationSourceId } : {}),
    }));
    for (const envelope of envelopes) target.set(envelope.id, clone(envelope.value));
    try {
      const result = await adapter.upsertMany(event.family, envelopes, policy.budget);
      for (const id of result.prunedIds || []) target.delete(id);
      observe(result.outcome, event.family, envelopes);
      return result;
    } catch (error) {
      for (const [id, value] of previous) {
        const failed = envelopes.find((envelope) => envelope.id === id);
        if (
          failed &&
          storageValueFingerprint(target.get(id)) !== storageValueFingerprint(failed.value)
        ) {
          continue;
        }
        if (value === null) target.delete(id);
        else target.set(id, value);
      }
      observe(StorageWriteOutcome.FAILED, event.family, envelopes);
      recordLearnedMonsterStoreFailure("upsert", event.family, error);
      return { outcome: StorageWriteOutcome.FAILED, error };
    }
  }

  const handlers = Object.freeze({
    [LearnedMonsterStoreEvent.HYDRATE]: hydrate,
    [LearnedMonsterStoreEvent.READ_MAP]: readMap,
    [LearnedMonsterStoreEvent.READ_RECORDS]: readRecords,
    [LearnedMonsterStoreEvent.UPSERT_MANY]: upsertMany,
    [LearnedMonsterStoreEvent.RESET_RUNTIME]: () => {
      caches.clear();
      return true;
    },
  });
  return Object.freeze({ run: (event) => handlers[event?.type]?.(event) });
}

const currentLearnedMonsterStore = createLearnedMonsterStoreCapability({
  ...CURRENT_WORLD_POLICY.learnedMonster,
  sourceIdentity: CURRENT_WORLD_POLICY.auditIdentity,
});
export function runLearnedMonsterStoreAutomation(event) {
  return currentLearnedMonsterStore.run(event);
}
