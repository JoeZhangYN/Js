const DB_VERSION = 1;
const STORE_RECEIPTS = "receipts";

export function createStorageMaintenanceReceiptAdapter({ indexedDb, dbName }) {
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
        if (!request.result.objectStoreNames.contains(STORE_RECEIPTS)) {
          request.result.createObjectStore(STORE_RECEIPTS);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error || new Error("storage maintenance database open failed"));
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
            transaction = db.transaction(STORE_RECEIPTS, mode);
            operation(transaction.objectStore(STORE_RECEIPTS), (value) => (result = value));
          } catch (error) {
            reject(error);
            return;
          }
          transaction.oncomplete = () => resolve(result);
          transaction.onerror = () =>
            reject(transaction.error || new Error("storage maintenance transaction failed"));
          transaction.onabort = () =>
            reject(transaction.error || new Error("storage maintenance transaction aborted"));
        })
    );
  }

  function read(sourceId) {
    return transact("readonly", (store, done) => {
      const request = store.get(sourceId);
      request.onsuccess = () => done(request.result || null);
    });
  }

  function write(receipt) {
    return transact("readwrite", (store, done) => {
      store.put(receipt, receipt.sourceId);
      done(receipt);
    });
  }

  function list() {
    return transact("readonly", (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => done(request.result || []);
    });
  }

  return Object.freeze({ read, write, list });
}
