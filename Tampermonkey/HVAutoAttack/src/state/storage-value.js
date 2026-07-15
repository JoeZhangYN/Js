function isPlainObject(value) {
  if (!value || Object.prototype.toString.call(value) !== "[object Object]") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function canonicalizeStorageValue(value) {
  if (Array.isArray(value)) return value.map(canonicalizeStorageValue);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalizeStorageValue(value[key])])
  );
}

export function storageValueFingerprint(value) {
  const canonical = canonicalizeStorageValue(value);
  if (canonical === undefined) return "undefined:";
  if (typeof canonical === "number" && Number.isNaN(canonical)) return "number:NaN";
  if (typeof canonical === "number" && !Number.isFinite(canonical)) {
    return `number:${String(canonical)}`;
  }
  try {
    return `${typeof canonical}:${JSON.stringify(canonical)}`;
  } catch {
    return `${typeof canonical}:${String(canonical)}`;
  }
}
