import { StorageWriteOutcome } from "../state/storage-io-policy.js";

const DB_VERSION = 1;
const STORES = Object.freeze(["drop", "usage"]);

function storeName(family) {
  if (!STORES.includes(family)) throw new TypeError(`Unknown battle report family: ${family}`);
  return family;
}

export function createBattleReportHistoryIndexedDbAdapter({ indexedDb, dbName }) {
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
        reject(request.error || new Error("battle report database open failed"));
      };
    });
    return dbPromise;
  }

  function transact(family, mode, operation) {
    return openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          let result;
          let tx;
          try {
            tx = db.transaction(storeName(family), mode);
            operation(tx.objectStore(storeName(family)), (value) => (result = value));
          } catch (error) {
            reject(error);
            return;
          }
          tx.oncomplete = () => resolve(result);
          tx.onerror = () => reject(tx.error || new Error("battle report transaction failed"));
          tx.onabort = () => reject(tx.error || new Error("battle report transaction aborted"));
        })
    );
  }

  function append(family, envelope, budget) {
    return transact(family, "readwrite", (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const records = request.result || [];
        if (records.some((record) => record.id === envelope.id)) {
          done({ outcome: StorageWriteOutcome.SKIPPED_UNCHANGED, rows: records.length, pruned: 0 });
          return;
        }
        store.put(envelope, envelope.id);
        records.push(envelope);
        let pruned = 0;
        if (records.length >= budget.compactAt) {
          records.sort((left, right) => left.createdAt - right.createdAt);
          for (const record of records.slice(0, -budget.rows)) {
            store.delete(record.id);
            pruned += 1;
          }
        }
        done({
          outcome: StorageWriteOutcome.WRITTEN,
          rows: records.length - pruned,
          pruned,
        });
      };
    });
  }

  function list(family) {
    return transact(family, "readonly", (store, done) => {
      const request = store.getAll();
      request.onsuccess = () =>
        done(
          (request.result || [])
            .sort((left, right) => left.createdAt - right.createdAt)
            .map((envelope) => envelope.record)
        );
    });
  }

  function listEnvelopes(family) {
    return transact(family, "readonly", (store, done) => {
      const request = store.getAll();
      request.onsuccess = () =>
        done((request.result || []).sort((left, right) => left.createdAt - right.createdAt));
    });
  }

  function clear(family) {
    return transact(family, "readwrite", (store, done) => {
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

  return Object.freeze({ append, list, listEnvelopes, clear });
}
