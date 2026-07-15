import { StorageWriteOutcome } from "./storage-io-policy.js";
import { canonicalizeStorageValue, storageValueFingerprint } from "./storage-value.js";

function readLocalValue(storage, key, canonicalValue) {
  const raw = typeof storage.getItem === "function" ? storage.getItem(key) : storage[key];
  if (typeof canonicalValue === "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function hasLocalValue(storage, key) {
  if (typeof storage.getItem === "function") return storage.getItem(key) !== null;
  return key in storage;
}

function writeLocalValue(storage, key, value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  if (typeof storage.setItem === "function") storage.setItem(key, serialized);
  else storage[key] = serialized;
}

export function writeCanonicalStorageValue({
  key,
  value,
  gmSet,
  gmGet,
  localStorage,
  onReadFailure,
}) {
  const canonicalValue = canonicalizeStorageValue(value);
  let existing;
  let present = false;
  if (typeof gmSet === "function" && typeof gmGet === "function") {
    try {
      existing = gmGet(key);
      present = existing !== undefined;
    } catch (error) {
      onReadFailure("gmGetBeforeWrite", error);
    }
  } else if (typeof gmSet !== "function") {
    present = hasLocalValue(localStorage, key);
    if (present) existing = readLocalValue(localStorage, key, canonicalValue);
  }
  if (present && storageValueFingerprint(existing) === storageValueFingerprint(canonicalValue)) {
    return { outcome: StorageWriteOutcome.SKIPPED_UNCHANGED, canonicalValue };
  }
  if (typeof gmSet === "function") gmSet(key, value);
  else writeLocalValue(localStorage, key, value);
  return { outcome: StorageWriteOutcome.WRITTEN, canonicalValue: value };
}

export function deleteStorageValue({ key, gmDelete, gmGet, localStorage, onReadFailure }) {
  let present = true;
  if (typeof gmDelete === "function" && typeof gmGet === "function") {
    try {
      present = gmGet(key) !== undefined;
    } catch (error) {
      onReadFailure("gmGetBeforeDelete", error);
    }
  } else if (typeof gmDelete !== "function") {
    present = hasLocalValue(localStorage, key);
  }
  if (!present) return StorageWriteOutcome.SKIPPED_UNCHANGED;
  if (typeof gmDelete === "function") gmDelete(key);
  else localStorage.removeItem(key);
  return StorageWriteOutcome.DELETED;
}
