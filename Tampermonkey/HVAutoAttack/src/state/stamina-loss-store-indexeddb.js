import { StorageWriteOutcome } from "./storage-io-policy.js";

const DB_VERSION = 1;
const STORE_NAME = "records";
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

export function createStaminaLossIndexedDbAdapter({ indexedDb, dbName }) {
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
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error || new Error("stamina loss database open failed"));
      };
    });
    return dbPromise;
  }

  function transact(mode, operation) {
    return openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          let result;
          let tx;
          try {
            tx = db.transaction(STORE_NAME, mode);
            operation(tx.objectStore(STORE_NAME), (value) => (result = value));
          } catch (error) {
            reject(error);
            return;
          }
          tx.oncomplete = () => resolve(result);
          tx.onerror = () => reject(tx.error || new Error("stamina loss transaction failed"));
          tx.onabort = () => reject(tx.error || new Error("stamina loss transaction aborted"));
        })
    );
  }

  function append(record, budget, now) {
    return transact("readwrite", (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const cutoff = now - budget.days * DAY_MILLISECONDS;
        const records = (request.result || []).filter((row) => row.id !== record.id);
        let pruned = 0;
        for (const row of records.filter((item) => item.observedAt < cutoff)) {
          store.delete(row.id);
          pruned += 1;
        }
        const retained = records.filter((item) => item.observedAt >= cutoff);
        retained.push(record);
        store.put(record, record.id);
        let compacted = 0;
        if (retained.length >= budget.compactAt) {
          retained.sort((left, right) => left.observedAt - right.observedAt);
          for (const row of retained.slice(0, -budget.rows)) {
            store.delete(row.id);
            pruned += 1;
            compacted += 1;
          }
        }
        done({ outcome: StorageWriteOutcome.WRITTEN, rows: retained.length - compacted, pruned });
      };
    });
  }

  function list() {
    return transact("readonly", (store, done) => {
      const request = store.getAll();
      request.onsuccess = () =>
        done((request.result || []).sort((left, right) => left.observedAt - right.observedAt));
    });
  }

  function clear() {
    return transact("readwrite", (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const deleted = (request.result || []).length;
        store.clear();
        done({
          outcome: deleted ? StorageWriteOutcome.DELETED : StorageWriteOutcome.SKIPPED_UNCHANGED,
          deleted,
        });
      };
    });
  }

  return Object.freeze({ append, clear, list });
}
