import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

export const RIDDLE_SAMPLE_STORE_FAILURE_KEY = DiagnosticEvidenceKey.RIDDLE_SAMPLE_STORE_FAILURE;

function rejectDbFailure(stage, detail, error) {
  const failure = {
    capability: "riddleSampleStore",
    source: "riddleSampleIndexedDb",
    stage,
    ...detail,
    error: error?.message || error?.name || String(error || "unknown"),
  };
  try {
    globalThis.sessionStorage?.setItem(RIDDLE_SAMPLE_STORE_FAILURE_KEY, JSON.stringify(failure));
  } catch {
    // IndexedDB failure evidence must not depend on another storage write.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] riddle sample store failed", failure],
  });
  const rejected = new Error(`riddle sample store ${stage} failed`);
  rejected.failure = failure;
  return rejected;
}

export function createRiddleSampleIndexedDbConnection({
  dbName,
  dbVersion,
  storeNames,
  indexedDb,
}) {
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      let request;
      try {
        request = indexedDb.open(dbName, dbVersion);
      } catch (error) {
        reject(rejectDbFailure("open", { dbName, dbVersion }, error));
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const storeName of storeNames) {
          if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(rejectDbFailure("open", { dbName, dbVersion }, request.error));
      };
    });
    return dbPromise;
  }

  function transaction(names, mode, operation) {
    return openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          let tx;
          let result;
          try {
            tx = db.transaction(names, mode);
            const immediate = operation(tx, (value) => {
              result = value;
            });
            if (immediate !== undefined) result = immediate;
          } catch (error) {
            reject(
              rejectDbFailure("transaction-start", { storeNames: [].concat(names), mode }, error)
            );
            return;
          }
          tx.oncomplete = () => resolve(result);
          tx.onerror = () =>
            reject(
              rejectDbFailure("transaction-error", { storeNames: [].concat(names), mode }, tx.error)
            );
          tx.onabort = () =>
            reject(
              rejectDbFailure("transaction-abort", { storeNames: [].concat(names), mode }, tx.error)
            );
        })
    );
  }

  return Object.freeze({ transaction });
}
