import { StorageIdentity, storageIoPolicyOf, StorageWriteOutcome } from "./storage-io-policy.js";
import { StorageIoMetricsEvent, runStorageIoMetricsAutomation } from "./storage-io-metrics.js";
import {
  createRiddleSampleIndexedDbAdapter,
  RIDDLE_SAMPLE_STORE_FAILURE_KEY,
} from "./riddle-sample-store-indexeddb.js";

const EVENT_WRITE = "write";
const EVENT_READ = "read";
const EVENT_LIST = "list";
const EVENT_INSPECT = "inspect";
const EVENT_DELETE_EXPORTED = "deleteExported";
const EVENT_RECEIPT_READ = "receiptRead";
const EVENT_RECEIPT_WRITE = "receiptWrite";
const EVENT_RECEIPT_LIST = "receiptList";

export { RIDDLE_SAMPLE_STORE_FAILURE_KEY };

export const RiddleSampleStoreEvent = Object.freeze({
  WRITE: EVENT_WRITE,
  READ: EVENT_READ,
  LIST: EVENT_LIST,
  INSPECT: EVENT_INSPECT,
  DELETE_EXPORTED: EVENT_DELETE_EXPORTED,
  RECEIPT_READ: EVENT_RECEIPT_READ,
  RECEIPT_WRITE: EVENT_RECEIPT_WRITE,
  RECEIPT_LIST: EVENT_RECEIPT_LIST,
});

export function createRiddleSampleStoreCapability(deps = {}) {
  const policy = storageIoPolicyOf(StorageIdentity.RIDDLE_SAMPLE);
  const adapter =
    deps.adapter ||
    createRiddleSampleIndexedDbAdapter({
      indexedDb: deps.indexedDb || globalThis.indexedDB,
      dbName: deps.dbName,
    });
  const recordMetric = deps.recordMetric || runStorageIoMetricsAutomation;

  async function write(event) {
    try {
      const result = await adapter.appendSample(event.record, policy.budget);
      recordMetric({
        type: StorageIoMetricsEvent.RECORD,
        identity: policy.identity,
        outcome: result.outcome,
        logicalBytes: event.record.totalBytes,
        sourceIdentity: event.sourceIdentity || "riddleSubmission",
      });
      return result;
    } catch (error) {
      recordMetric({
        type: StorageIoMetricsEvent.RECORD,
        identity: policy.identity,
        outcome: StorageWriteOutcome.FAILED,
        logicalBytes: event.record?.totalBytes || 0,
        sourceIdentity: event.sourceIdentity || "riddleSubmission",
      });
      throw error;
    }
  }

  async function deleteExported(event) {
    try {
      const result = await adapter.deleteSamples(event.ids || []);
      recordMetric({
        type: StorageIoMetricsEvent.RECORD,
        identity: policy.identity,
        outcome: result.outcome,
        logicalBytes: result.deletedBytes || 0,
        sourceIdentity: "riddleDatasetExport",
      });
      return result;
    } catch (error) {
      recordMetric({
        type: StorageIoMetricsEvent.RECORD,
        identity: policy.identity,
        outcome: StorageWriteOutcome.FAILED,
        logicalBytes: 0,
        sourceIdentity: "riddleDatasetExport",
      });
      throw error;
    }
  }

  const handlers = Object.freeze({
    [EVENT_WRITE]: write,
    [EVENT_READ]: (event) => adapter.readSample(event.id),
    [EVENT_LIST]: () => adapter.listSamples(),
    [EVENT_INSPECT]: () => adapter.inspect(),
    [EVENT_DELETE_EXPORTED]: deleteExported,
    [EVENT_RECEIPT_READ]: (event) => adapter.readReceipt(event.sourceKey),
    [EVENT_RECEIPT_WRITE]: (event) => adapter.writeReceipt(event.receipt),
    [EVENT_RECEIPT_LIST]: () => adapter.listReceipts(),
  });

  return Object.freeze({
    run(event) {
      return handlers[event?.type]?.(event);
    },
  });
}

const currentRiddleSampleStore = createRiddleSampleStoreCapability();

export function runRiddleSampleStoreAutomation(event) {
  return currentRiddleSampleStore.run(event);
}
