import { describe, expect, it, vi } from "vitest";
import { createRuntimeStoreCapability } from "./store.js";
import { createStorageCapability } from "./storage.js";
import { StorageIdentity, StorageWriteOutcome } from "./storage-io-policy.js";

function memoryStorage() {
  return {
    removeItem(key) {
      delete this[key];
    },
  };
}

describe("state capability factories", () => {
  it("binds two storage namespaces without passing World to calls", () => {
    const values = new Map();
    const recordIo = vi.fn();
    const ports = {
      gmSetValue: (key, value) => values.set(key, value),
      gmGetValue: (key) => values.get(key),
      gmDeleteValue: (key) => values.delete(key),
      warn: vi.fn(),
      recordIo,
    };
    const persistent = createStorageCapability({ prefix: "hvAA_" }, ports);
    const isekai = createStorageCapability({ prefix: "hvAA_isekai_" }, ports);

    expect(persistent.setValue("factoryProbe", { value: "p" })).toBe(StorageWriteOutcome.WRITTEN);
    expect(isekai.setValue("factoryProbe", { value: "i" })).toBe(StorageWriteOutcome.WRITTEN);

    expect(persistent.getValue("factoryProbe")).toMatchObject({ value: "p" });
    expect(isekai.getValue("factoryProbe")).toMatchObject({ value: "i" });
    expect([...values.keys()]).toEqual(["hvAA_factoryProbe", "hvAA_isekai_factoryProbe"]);
    expect(recordIo).toHaveBeenCalledTimes(2);
    expect(recordIo).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        identity: StorageIdentity.WORLD_SMALL_VALUE,
        outcome: StorageWriteOutcome.WRITTEN,
        sourceIdentity: "hvAA_",
      })
    );
  });

  it("keeps runtime stores isolated by construction", () => {
    const persistent = createRuntimeStoreCapability();
    const isekai = createRuntimeStoreCapability();

    persistent.g("round", 4);
    isekai.g("round", 9);

    expect(persistent.g("round")).toBe(4);
    expect(isekai.g("round")).toBe(9);
    expect(persistent.g()).not.toBe(isekai.g());
  });

  it("keeps localStorage fallback behavior for factory instances", () => {
    const storage = memoryStorage();
    const capability = createStorageCapability(
      { prefix: "test_" },
      { localStorage: storage, warn: vi.fn() }
    );

    capability.setValue("value", { ok: true });
    expect(storage.test_value).toBe('{"ok":true}');
    capability.delValue("value");
    expect(storage).not.toHaveProperty("test_value");
  });
});
