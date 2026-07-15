import { measureStorageLogicalBytes } from "./storage-io-metrics.js";
import { storageValueFingerprint } from "./storage-value.js";

export function storageMaintenanceValueHash(value) {
  const text = storageValueFingerprint(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function describeStorageMaintenanceValue(sourceId, value) {
  return Object.freeze({
    sourceId,
    bytes: measureStorageLogicalBytes(sourceId, value),
    contentHash: storageMaintenanceValueHash(value),
  });
}
