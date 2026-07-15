import { StorageWriteOutcome } from "./storage-io-policy.js";
import { storageValueFingerprint } from "./storage-value.js";

const DB_VERSION = 1;
const STORES = Object.freeze(["bigKill", "incomingBurst"]);

function storeName(family) {
  if (!STORES.includes(family)) throw new TypeError(`Unknown learned monster family: ${family}`);
  return family;
}

export function createLearnedMonsterIndexedDbAdapter({ indexedDb, dbName }) {
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      let request;
      try {
        request = indexedDb.open(dbName, DB_VERSION);
      } catch (error) {
        reject(error);
        return;
      }
      request.onupgradeneeded = () => {
        for (const name of STORES) {
          if (!request.result.objectStoreNames.contains(name)) {
            request.result.createObjectStore(name);
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error || new Error("learned monster database open failed"));
      };
    });
    return dbPromise;
  }

  function transact(family, mode, operation) {
    return openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          let result;
          let transaction;
          try {
            transaction = db.transaction(storeName(family), mode);
            operation(transaction.objectStore(storeName(family)), (value) => (result = value));
          } catch (error) {
            reject(error);
            return;
          }
          transaction.oncomplete = () => resolve(result);
          transaction.onerror = () =>
            reject(transaction.error || new Error("learned monster transaction failed"));
          transaction.onabort = () =>
            reject(transaction.error || new Error("learned monster transaction aborted"));
        })
    );
  }

  function list(family) {
    return transact(family, "readonly", (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => done(request.result || []);
    });
  }

  function upsertMany(family, envelopes, budget) {
    return transact(family, "readwrite", (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const existing = new Map((request.result || []).map((record) => [record.id, record]));
        const writtenIds = [];
        for (const envelope of envelopes) {
          const prior = existing.get(envelope.id);
          if (
            prior &&
            storageValueFingerprint(prior.value) === storageValueFingerprint(envelope.value)
          ) {
            continue;
          }
          existing.set(envelope.id, envelope);
          store.put(envelope, envelope.id);
          writtenIds.push(envelope.id);
        }
        if (!writtenIds.length) {
          done({ outcome: StorageWriteOutcome.SKIPPED_UNCHANGED, writtenIds, prunedIds: [] });
          return;
        }
        const prunedIds = [];
        if (existing.size >= budget.compactAt) {
          const oldest = [...existing.values()].sort(
            (left, right) => left.lastUsed - right.lastUsed
          );
          for (const record of oldest.slice(0, -budget.rows)) {
            store.delete(record.id);
            prunedIds.push(record.id);
          }
        }
        done({ outcome: StorageWriteOutcome.WRITTEN, writtenIds, prunedIds });
      };
    });
  }

  return Object.freeze({ list, upsertMany });
}
