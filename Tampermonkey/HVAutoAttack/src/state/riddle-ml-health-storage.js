// RMA-compatible unprefixed small-value adapter. It owns the only health-key GM authority and
// performs canonical write-if-changed across legacy synchronous and modern Promise APIs.
import {
  measureStorageLogicalBytes,
  runStorageIoMetricsAutomation,
  StorageIoMetricsEvent,
} from "./storage-io-metrics.js";
import { StorageIdentity, StorageWriteOutcome } from "./storage-io-policy.js";
import { canonicalizeStorageValue, storageValueFingerprint } from "./storage-value.js";

function resolveApi() {
  const legacyGet = globalThis.GM_getValue;
  const legacySet = globalThis.GM_setValue;
  const modern = globalThis.GM;
  return {
    get:
      typeof legacyGet === "function"
        ? (key, fallback) => legacyGet(key, fallback)
        : typeof modern?.getValue === "function"
          ? (key, fallback) => modern.getValue(key, fallback)
          : null,
    set:
      typeof legacySet === "function"
        ? (key, value) => legacySet(key, value)
        : typeof modern?.setValue === "function"
          ? (key, value) => modern.setValue(key, value)
          : null,
  };
}

function recordWriteOutcome(key, value, outcome) {
  runStorageIoMetricsAutomation({
    type: StorageIoMetricsEvent.RECORD,
    identity: StorageIdentity.WORLD_SMALL_VALUE,
    outcome,
    logicalBytes: measureStorageLogicalBytes(key, value),
    sourceIdentity: "riddleMlHealth",
  });
}

export async function readRiddleMlHealthStorage(key, fallback) {
  const { get } = resolveApi();
  if (!get) return fallback;
  return (await get(key, fallback)) ?? fallback;
}

export async function writeRiddleMlHealthStorage(key, value) {
  const { get, set } = resolveApi();
  const canonical = canonicalizeStorageValue(value);
  if (!set) {
    recordWriteOutcome(key, canonical, StorageWriteOutcome.SKIPPED_POLICY);
    return StorageWriteOutcome.SKIPPED_POLICY;
  }
  try {
    let existing;
    if (get) existing = await get(key, undefined);
    const outcome =
      existing !== undefined &&
      storageValueFingerprint(existing) === storageValueFingerprint(canonical)
        ? StorageWriteOutcome.SKIPPED_UNCHANGED
        : StorageWriteOutcome.WRITTEN;
    if (outcome === StorageWriteOutcome.WRITTEN) await set(key, canonical);
    recordWriteOutcome(key, canonical, outcome);
    return outcome;
  } catch (error) {
    recordWriteOutcome(key, canonical, StorageWriteOutcome.FAILED);
    throw error;
  }
}
