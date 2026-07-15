import { describe, expect, it } from "vitest";
import { createTestIndexedDb } from "../../test/fake-indexeddb.js";
import { createMonsterDbIndexedDbAdapter } from "./monster-db-store-indexeddb.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

describe("monster knowledge content-aware writes", () => {
  it("performs zero physical writes for unchanged bulk snapshots", async () => {
    const indexedDb = createTestIndexedDb();
    const store = createMonsterDbIndexedDbAdapter({ indexedDb, dbName: "monster" });
    const profiles = [
      { monsterId: 1, fire: 10, dark: 20 },
      { monsterId: 2, fire: 30, dark: 40 },
    ];

    await expect(store.writeProfiles(profiles)).resolves.toMatchObject({
      outcome: StorageWriteOutcome.WRITTEN,
      written: 2,
    });
    const puts = indexedDb.operations.puts;
    await expect(
      store.writeProfiles([
        { dark: 20, fire: 10, monsterId: 1 },
        { dark: 40, monsterId: 2, fire: 30 },
      ])
    ).resolves.toEqual({
      outcome: StorageWriteOutcome.SKIPPED_UNCHANGED,
      received: 2,
      written: 0,
      unchanged: 2,
    });
    expect(indexedDb.operations.puts).toBe(puts);
  });

  it("writes only changed profiles and skips unchanged metadata", async () => {
    const indexedDb = createTestIndexedDb();
    const store = createMonsterDbIndexedDbAdapter({ indexedDb, dbName: "monster" });
    await store.writeProfiles([
      { monsterId: 1, fire: 10 },
      { monsterId: 2, fire: 20 },
    ]);
    await expect(
      store.writeProfiles([
        { monsterId: 1, fire: 11 },
        { monsterId: 2, fire: 20 },
      ])
    ).resolves.toMatchObject({ written: 1, unchanged: 1 });

    await store.writeMeta("lastSync", "2026-07-15");
    const puts = indexedDb.operations.puts;
    await expect(store.writeMeta("lastSync", "2026-07-15")).resolves.toMatchObject({
      outcome: StorageWriteOutcome.SKIPPED_UNCHANGED,
      written: 0,
    });
    expect(indexedDb.operations.puts).toBe(puts);
  });
});
