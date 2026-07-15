import { describe, expect, it, vi } from "vitest";
import { createHvutConfigStoreCapability } from "./hvut-config-store.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

describe("HVUT small config storage", () => {
  it("canonicalizes equal values and avoids the old localStorage mirror", () => {
    const values = new Map();
    const gmSetValue = vi.fn((key, value) => values.set(key, value));
    const store = createHvutConfigStoreCapability(
      { namespace: "hvut", sourceIdentity: "persistent" },
      {
        gmGetValue: (key) => values.get(key),
        gmSetValue,
        gmDeleteValue: (key) => values.delete(key),
        recordIo: vi.fn(),
      }
    );

    expect(store.write("settings", { z: 2, a: 1 })).toBe(StorageWriteOutcome.WRITTEN);
    expect(store.write("settings", { a: 1, z: 2 })).toBe(StorageWriteOutcome.SKIPPED_UNCHANGED);
    expect(gmSetValue).toHaveBeenCalledTimes(1);
    expect(values.get("hvut_settings")).toEqual({ z: 2, a: 1 });
  });
});
