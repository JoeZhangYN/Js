import { storageIoPolicyOf, StorageWriteOutcome } from "./storage-io-policy.js";

const EVENT_RECORD = "record";
const EVENT_SNAPSHOT = "snapshot";
const EVENT_RESET = "reset";

export const StorageIoMetricsEvent = Object.freeze({
  RECORD: EVENT_RECORD,
  SNAPSHOT: EVENT_SNAPSHOT,
  RESET: EVENT_RESET,
});

const writeOutcomes = new Set(Object.values(StorageWriteOutcome));

function emptyMetric(identity) {
  return {
    identity,
    attemptedWrites: 0,
    physicalWrites: 0,
    skippedWrites: 0,
    rejectedWrites: 0,
    failedWrites: 0,
    deletes: 0,
    logicalBytesAttempted: 0,
    logicalBytesWritten: 0,
    maximumLogicalBytes: 0,
    lastOutcome: null,
    lastSourceIdentity: null,
    lastObservedAt: null,
  };
}

function cloneSnapshot(metrics) {
  return Object.freeze(
    Object.fromEntries(
      [...metrics].map(([identity, metric]) => [identity, Object.freeze({ ...metric })])
    )
  );
}

export function createStorageIoMetricsCapability(ports = {}) {
  const metrics = new Map();
  const now = ports.now || (() => Date.now());

  function record(event) {
    const policy = storageIoPolicyOf(event.identity);
    if (!writeOutcomes.has(event.outcome)) {
      throw new TypeError(`Unknown storage write outcome: ${String(event.outcome)}`);
    }
    const logicalBytes = Number(event.logicalBytes ?? 0);
    if (!Number.isFinite(logicalBytes) || logicalBytes < 0) {
      throw new TypeError("Storage logicalBytes must be a non-negative finite number");
    }

    const metric = metrics.get(policy.identity) || emptyMetric(policy.identity);
    metric.attemptedWrites += 1;
    metric.logicalBytesAttempted += logicalBytes;
    metric.maximumLogicalBytes = Math.max(metric.maximumLogicalBytes, logicalBytes);
    metric.lastOutcome = event.outcome;
    metric.lastSourceIdentity = event.sourceIdentity ?? null;
    metric.lastObservedAt = now();

    if (event.outcome === StorageWriteOutcome.WRITTEN) {
      metric.physicalWrites += 1;
      metric.logicalBytesWritten += logicalBytes;
    } else if (event.outcome === StorageWriteOutcome.DELETED) {
      metric.physicalWrites += 1;
      metric.deletes += 1;
      metric.logicalBytesWritten += logicalBytes;
    } else if (
      event.outcome === StorageWriteOutcome.SKIPPED_UNCHANGED ||
      event.outcome === StorageWriteOutcome.SKIPPED_POLICY
    ) {
      metric.skippedWrites += 1;
    } else if (event.outcome === StorageWriteOutcome.REJECTED_BUDGET) {
      metric.rejectedWrites += 1;
    } else if (event.outcome === StorageWriteOutcome.FAILED) {
      metric.failedWrites += 1;
    }

    metrics.set(policy.identity, metric);
    return Object.freeze({ ...metric });
  }

  return Object.freeze({
    run(event = { type: EVENT_SNAPSHOT }) {
      if (event?.type === EVENT_RECORD) return record(event);
      if (event?.type === EVENT_SNAPSHOT) return cloneSnapshot(metrics);
      if (event?.type === EVENT_RESET) {
        metrics.clear();
        return cloneSnapshot(metrics);
      }
      return undefined;
    },
  });
}

const currentStorageIoMetrics = createStorageIoMetricsCapability();

export function runStorageIoMetricsAutomation(event = { type: EVENT_SNAPSHOT }) {
  return currentStorageIoMetrics.run(event);
}

export function measureStorageLogicalBytes(key, value) {
  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    return new TextEncoder().encode(String(key) + (serialized ?? "undefined")).byteLength;
  } catch {
    return new TextEncoder().encode(String(key)).byteLength;
  }
}
