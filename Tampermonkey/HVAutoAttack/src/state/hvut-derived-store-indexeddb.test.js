import { describe, expect, it } from "vitest";
import { createTestIndexedDb } from "../../test/fake-indexeddb.js";
import { createHvutDerivedIndexedDbAdapter } from "./hvut-derived-store-indexeddb.js";
import { assembleHvutDerivedValue } from "./hvut-derived-value.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

async function readFamily(adapter, family) {
  const snapshot = await adapter.load();
  return assembleHvutDerivedValue(
    snapshot.meta.find((meta) => meta.family === family),
    snapshot.records.filter((record) => record.family === family)
  );
}

describe("HVUT derived IndexedDB adapter", () => {
  it("writes only changed top-level records and skips an unchanged aggregate", async () => {
    const indexedDb = createTestIndexedDb();
    const adapter = createHvutDerivedIndexedDbAdapter({ indexedDb, dbName: "hvut" });

    await expect(
      adapter.sync("equipdata", { version: 1, 7: { checked: true } })
    ).resolves.toMatchObject({
      outcome: StorageWriteOutcome.WRITTEN,
      written: 2,
    });
    const puts = indexedDb.operations.puts;
    await expect(
      adapter.sync("equipdata", { 7: { checked: true }, version: 1 })
    ).resolves.toMatchObject({ outcome: StorageWriteOutcome.SKIPPED_UNCHANGED, written: 0 });
    expect(indexedDb.operations.puts).toBe(puts);

    await expect(
      adapter.sync("equipdata", { version: 1, 7: { checked: false } })
    ).resolves.toMatchObject({
      outcome: StorageWriteOutcome.WRITTEN,
      written: 1,
    });
    await expect(readFamily(adapter, "equipdata")).resolves.toEqual({
      version: 1,
      7: { checked: false },
    });
  });

  it("preserves array shape while deleting only removed records", async () => {
    const indexedDb = createTestIndexedDb();
    const adapter = createHvutDerivedIndexedDbAdapter({ indexedDb, dbName: "hvut" });
    await adapter.sync("ml_log", [{ version: 1 }, { wins: 2 }, { wins: 3 }]);

    await expect(adapter.sync("ml_log", [{ version: 1 }, { wins: 4 }])).resolves.toMatchObject({
      written: 1,
      deletes: 1,
    });
    await expect(readFamily(adapter, "ml_log")).resolves.toEqual([{ version: 1 }, { wins: 4 }]);
  });

  it("keeps persistent and Isekai databases isolated", async () => {
    const indexedDb = createTestIndexedDb();
    const persistent = createHvutDerivedIndexedDbAdapter({ indexedDb, dbName: "hvut" });
    const isekai = createHvutDerivedIndexedDbAdapter({ indexedDb, dbName: "hvuti" });
    await persistent.sync("ss_log", { trophy: { Peerless: 1 } });

    await expect(readFamily(persistent, "ss_log")).resolves.toEqual({ trophy: { Peerless: 1 } });
    await expect(readFamily(isekai, "ss_log")).resolves.toBeUndefined();
  });
});
