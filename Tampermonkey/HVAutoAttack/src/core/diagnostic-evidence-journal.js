import {
  storageIoPolicyOf,
  StorageIdentity,
  StorageWriteOutcome,
} from "../state/storage-io-policy.js";
import {
  measureStorageLogicalBytes,
  runStorageIoMetricsAutomation,
  StorageIoMetricsEvent,
} from "../state/storage-io-metrics.js";

const EVENT_RECORD = "record";
const EVENT_READ = "read";
const EVENT_SNAPSHOT = "snapshot";
const EVENT_RESET = "reset";

export const DiagnosticEvidenceJournalEvent = Object.freeze({
  RECORD: EVENT_RECORD,
  READ: EVENT_READ,
  SNAPSHOT: EVENT_SNAPSHOT,
  RESET: EVENT_RESET,
});

function byteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}

function boundedValue(value, byteBudget) {
  if (byteLength(value) <= byteBudget) return value;
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = undefined;
  }
  return JSON.stringify({
    truncated: true,
    originalBytes: byteLength(value),
    capability: parsed?.capability,
    stage: parsed?.stage,
    reason: parsed?.reason,
  });
}

export function createDiagnosticEvidenceJournalCapability() {
  const policy = storageIoPolicyOf(StorageIdentity.DIAGNOSTIC_EVIDENCE);
  const entries = [];
  let totalBytes = 0;

  function record(event) {
    const value = boundedValue(String(event.value), policy.budget.bytes);
    const bytes = byteLength(String(event.key)) + byteLength(value);
    while (
      entries.length &&
      (entries.length >= policy.budget.events || totalBytes + bytes > policy.budget.bytes)
    ) {
      totalBytes -= entries.shift().bytes;
    }
    entries.push(Object.freeze({ key: String(event.key), value, bytes }));
    totalBytes += bytes;
    return value;
  }

  function read(key) {
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      if (entries[index].key === key) return entries[index].value;
    }
    return null;
  }

  return Object.freeze({
    run(event = { type: EVENT_SNAPSHOT }) {
      if (event?.type === EVENT_RECORD) return record(event);
      if (event?.type === EVENT_READ) return read(String(event.key));
      if (event?.type === EVENT_SNAPSHOT) {
        return Object.freeze({
          entries: Object.freeze(entries.map((entry) => Object.freeze({ ...entry }))),
          totalBytes,
        });
      }
      if (event?.type === EVENT_RESET) {
        entries.length = 0;
        totalBytes = 0;
        return true;
      }
      return undefined;
    },
  });
}

const currentDiagnosticEvidenceJournal = createDiagnosticEvidenceJournalCapability();

export function runDiagnosticEvidenceJournal(event = { type: EVENT_SNAPSHOT }) {
  return currentDiagnosticEvidenceJournal.run(event);
}

export function writeDiagnosticSessionSnapshot(key, evidence, storage = globalThis.sessionStorage) {
  const raw = boundedValue(JSON.stringify(evidence), 64 * 1024 - byteLength(String(key)));
  runDiagnosticEvidenceJournal({ type: EVENT_RECORD, key, value: raw });
  const metric = {
    type: StorageIoMetricsEvent.RECORD,
    identity: StorageIdentity.DIAGNOSTIC_EVIDENCE,
    logicalBytes: measureStorageLogicalBytes(key, raw),
    sourceIdentity: String(key),
  };
  try {
    if (storage?.getItem?.(key) === raw) {
      runStorageIoMetricsAutomation({
        ...metric,
        outcome: StorageWriteOutcome.SKIPPED_UNCHANGED,
      });
      return true;
    }
    storage?.setItem(key, raw);
    runStorageIoMetricsAutomation({ ...metric, outcome: StorageWriteOutcome.WRITTEN });
    return true;
  } catch {
    runStorageIoMetricsAutomation({ ...metric, outcome: StorageWriteOutcome.FAILED });
    return false;
  }
}

export const diagnosticEvidenceMemoryStorage = Object.freeze({
  setItem(key, value) {
    runDiagnosticEvidenceJournal({ type: EVENT_RECORD, key, value });
  },
  getItem(key) {
    return runDiagnosticEvidenceJournal({ type: EVENT_READ, key });
  },
  removeItem(key) {
    const snapshot = runDiagnosticEvidenceJournal({ type: EVENT_SNAPSHOT });
    runDiagnosticEvidenceJournal({ type: EVENT_RESET });
    for (const entry of snapshot.entries) {
      if (entry.key !== String(key)) {
        runDiagnosticEvidenceJournal({ type: EVENT_RECORD, key: entry.key, value: entry.value });
      }
    }
  },
  clear() {
    runDiagnosticEvidenceJournal({ type: EVENT_RESET });
  },
});
