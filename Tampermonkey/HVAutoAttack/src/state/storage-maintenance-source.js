import { storageMaintenanceValueHash } from "./storage-maintenance-value.js";

export function createVerifiedMaintenanceSource(source) {
  return Object.freeze({
    normalize: (value) => value,
    verifyTargetHash: (expected, target) => storageMaintenanceValueHash(target) === expected,
    ...source,
  });
}

export function worldStorageKey(policy, logicalKey) {
  return `${policy.storage.prefix}${logicalKey}`;
}
