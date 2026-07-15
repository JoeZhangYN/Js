import {
  createRiddleSampleIndexedDbConnection,
  RIDDLE_SAMPLE_STORE_FAILURE_KEY,
} from "./riddle-sample-indexeddb-connection.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

const DB_VERSION = 1;
const STORE_SAMPLES = "samples";
const STORE_META = "meta";
const STORE_RECEIPTS = "migrationReceipts";
const USAGE_KEY = "usage";

export const RIDDLE_SAMPLE_DB_NAME = "HVAA_riddle_samples";
export { RIDDLE_SAMPLE_STORE_FAILURE_KEY };

function emptyUsage() {
  return { completedRecords: 0, bytes: 0 };
}

export function createRiddleSampleIndexedDbAdapter({ dbName = RIDDLE_SAMPLE_DB_NAME, indexedDb }) {
  const { transaction } = createRiddleSampleIndexedDbConnection({
    dbName,
    dbVersion: DB_VERSION,
    storeNames: [STORE_SAMPLES, STORE_META, STORE_RECEIPTS],
    indexedDb,
  });

  function appendSample(record, budget) {
    return transaction([STORE_SAMPLES, STORE_META], "readwrite", (tx, setResult) => {
      const samples = tx.objectStore(STORE_SAMPLES);
      const meta = tx.objectStore(STORE_META);
      const existingRequest = samples.get(record.id);
      const usageRequest = meta.get(USAGE_KEY);
      let existingLoaded = false;
      let usageLoaded = false;

      function decide() {
        if (!existingLoaded || !usageLoaded) return;
        const usage = usageRequest.result || emptyUsage();
        if (existingRequest.result) {
          setResult({ outcome: StorageWriteOutcome.SKIPPED_UNCHANGED, usage, record });
          return;
        }
        const next = {
          completedRecords: usage.completedRecords + 1,
          bytes: usage.bytes + record.totalBytes,
        };
        if (next.completedRecords > budget.completedRecords || next.bytes > budget.bytes) {
          setResult({
            outcome: StorageWriteOutcome.REJECTED_BUDGET,
            usage,
            attemptedUsage: next,
            recovery: "exportRequired",
          });
          return;
        }
        samples.put(record, record.id);
        meta.put(next, USAGE_KEY);
        setResult({ outcome: StorageWriteOutcome.WRITTEN, usage: next, record });
      }

      existingRequest.onsuccess = () => {
        existingLoaded = true;
        decide();
      };
      usageRequest.onsuccess = () => {
        usageLoaded = true;
        decide();
      };
    });
  }

  function readSample(id) {
    return transaction(STORE_SAMPLES, "readonly", (tx, setResult) => {
      const request = tx.objectStore(STORE_SAMPLES).get(id);
      request.onsuccess = () => setResult(request.result || null);
    });
  }

  function listSamples() {
    return transaction(STORE_SAMPLES, "readonly", (tx, setResult) => {
      const request = tx.objectStore(STORE_SAMPLES).getAll();
      request.onsuccess = () => setResult(request.result || []);
    });
  }

  function inspect() {
    return transaction(STORE_META, "readonly", (tx, setResult) => {
      const request = tx.objectStore(STORE_META).get(USAGE_KEY);
      request.onsuccess = () => setResult(request.result || emptyUsage());
    });
  }

  function deleteSamples(ids) {
    const selected = new Set(ids || []);
    return transaction([STORE_SAMPLES, STORE_META], "readwrite", (tx, setResult) => {
      const samples = tx.objectStore(STORE_SAMPLES);
      const meta = tx.objectStore(STORE_META);
      const request = samples.getAll();
      request.onsuccess = () => {
        const retained = [];
        let deleted = 0;
        let deletedBytes = 0;
        for (const record of request.result || []) {
          if (selected.has(record.id)) {
            samples.delete(record.id);
            deleted += 1;
            deletedBytes += Number(record.totalBytes || 0);
          } else {
            retained.push(record);
          }
        }
        const usage = {
          completedRecords: retained.length,
          bytes: retained.reduce((total, record) => total + Number(record.totalBytes || 0), 0),
        };
        meta.put(usage, USAGE_KEY);
        setResult({
          outcome: deleted ? StorageWriteOutcome.DELETED : StorageWriteOutcome.SKIPPED_UNCHANGED,
          deleted,
          deletedBytes,
          usage,
        });
      };
    });
  }

  function readReceipt(sourceKey) {
    return transaction(STORE_RECEIPTS, "readonly", (tx, setResult) => {
      const request = tx.objectStore(STORE_RECEIPTS).get(sourceKey);
      request.onsuccess = () => setResult(request.result || null);
    });
  }

  function writeReceipt(receipt) {
    return transaction(STORE_RECEIPTS, "readwrite", (tx, setResult) => {
      tx.objectStore(STORE_RECEIPTS).put(receipt, receipt.sourceKey);
      setResult(receipt);
    });
  }

  function listReceipts() {
    return transaction(STORE_RECEIPTS, "readonly", (tx, setResult) => {
      const request = tx.objectStore(STORE_RECEIPTS).getAll();
      request.onsuccess = () => setResult(request.result || []);
    });
  }

  return Object.freeze({
    appendSample,
    readSample,
    listSamples,
    inspect,
    deleteSamples,
    readReceipt,
    writeReceipt,
    listReceipts,
  });
}
