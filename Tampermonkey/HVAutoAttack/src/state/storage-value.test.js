import { describe, expect, it } from "vitest";
import { canonicalizeStorageValue, storageValueFingerprint } from "./storage-value.js";

describe("storage value canonicalization", () => {
  it("sorts nested object keys without reordering arrays", () => {
    expect(canonicalizeStorageValue({ z: 1, a: { y: 2, x: 3 }, list: [{ b: 1, a: 2 }] })).toEqual({
      a: { x: 3, y: 2 },
      list: [{ a: 2, b: 1 }],
      z: 1,
    });
  });

  it("gives semantically equal objects one fingerprint", () => {
    expect(storageValueFingerprint({ b: 2, a: 1 })).toBe(storageValueFingerprint({ a: 1, b: 2 }));
    expect(storageValueFingerprint(undefined)).not.toBe(storageValueFingerprint(null));
    expect(storageValueFingerprint(Number.NaN)).not.toBe(storageValueFingerprint(null));
  });
});
