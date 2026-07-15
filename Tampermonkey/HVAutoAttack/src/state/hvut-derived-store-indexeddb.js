import { StorageWriteOutcome } from "./storage-io-policy.js";
import { storageValueFingerprint } from "./storage-value.js";
import { hvutDerivedRecordKey, splitHvutDerivedValue } from "./hvut-derived-value.js";

const DB_VERSION = 1;
const STORE_RECORDS = "records";
const STORE_META = "meta";

export function createHvutDerivedIndexedDbAdapter({ indexedDb, dbName }) {
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      let request;
      try {
        request = indexedDb.open(dbName, DB_VERSION);
      } catch (error) {
        dbPromise = null;
        reject(error);
        return;
      }
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_RECORDS)) {
          request.result.createObjectStore(STORE_RECORDS);
        }
        if (!request.result.objectStoreNames.contains(STORE_META)) {
          request.result.createObjectStore(STORE_META);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error || new Error("HVUT derived database open failed"));
      };
    });
    return dbPromise;
  }

  function transact(mode, operation) {
    return openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          let result;
          let transaction;
          try {
            transaction = db.transaction([STORE_RECORDS, STORE_META], mode);
            result = operation(
              transaction.objectStore(STORE_RECORDS),
              transaction.objectStore(STORE_META)
            );
          } catch (error) {
            reject(error);
            return;
          }
          transaction.oncomplete = () => resolve(result.value);
          transaction.onerror = () => reject(transaction.error || new Error("transaction failed"));
          transaction.onabort = () => reject(transaction.error || new Error("transaction aborted"));
        })
    );
  }

  function load() {
    return transact("readonly", (recordStore, metaStore) => {
      const result = { value: { records: [], meta: [] } };
      const records = recordStore.getAll();
      const meta = metaStore.getAll();
      records.onsuccess = () => (result.value.records = records.result || []);
      meta.onsuccess = () => (result.value.meta = meta.result || []);
      return result;
    });
  }

  function sync(family, value) {
    return transact("readwrite", (recordStore, metaStore) => {
      const result = { value: null };
      const recordsRequest = recordStore.getAll();
      const metaRequest = metaStore.get(family);
      let recordsReady = false;
      let metaReady = false;
      const apply = () => {
        if (!recordsReady || !metaReady) return;
        const next = splitHvutDerivedValue(family, value);
        const existing = new Map(
          (recordsRequest.result || [])
            .filter((record) => record.family === family)
            .map((record) => [record.recordId, record])
        );
        let written = 0;
        for (const record of next.records) {
          const prior = existing.get(record.recordId);
          if (storageValueFingerprint(prior?.value) !== storageValueFingerprint(record.value)) {
            recordStore.put(record, hvutDerivedRecordKey(family, record.recordId));
            written += 1;
          }
          existing.delete(record.recordId);
        }
        for (const recordId of existing.keys()) {
          recordStore.delete(hvutDerivedRecordKey(family, recordId));
        }
        const metaChanged =
          storageValueFingerprint(metaRequest.result) !== storageValueFingerprint(next.meta);
        if (metaChanged) metaStore.put(next.meta, family);
        const deletes = existing.size;
        result.value = {
          outcome:
            written || deletes || metaChanged
              ? StorageWriteOutcome.WRITTEN
              : StorageWriteOutcome.SKIPPED_UNCHANGED,
          written,
          deletes,
          metaWritten: metaChanged,
        };
      };
      recordsRequest.onsuccess = () => {
        recordsReady = true;
        apply();
      };
      metaRequest.onsuccess = () => {
        metaReady = true;
        apply();
      };
      return result;
    });
  }

  return Object.freeze({ load, sync });
}
