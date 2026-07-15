import { describe, expect, it } from "vitest";
import { createTestIndexedDb } from "../../test/fake-indexeddb.js";
import { createLearnedMonsterIndexedDbAdapter } from "./learned-monster-store-indexeddb.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

const BUDGET = Object.freeze({ rows: 4096, compactAt: 4352 });

function records(count, start = 0) {
  return Array.from({ length: count }, (_, offset) => {
    const id = start + offset;
    return { id: String(id), value: { score: id }, lastUsed: id };
  });
}

describe("learned monster IndexedDB retention", () => {
  it("prunes exactly from 4352 to 4096 by oldest learning use", async () => {
    const indexedDb = createTestIndexedDb();
    const store = createLearnedMonsterIndexedDbAdapter({ indexedDb, dbName: "learned" });

    await store.upsertMany("bigKill", records(4351), BUDGET);
    const compacted = await store.upsertMany("bigKill", records(1, 4351), BUDGET);
    const retained = await store.list("bigKill");

    expect(compacted).toMatchObject({
      outcome: StorageWriteOutcome.WRITTEN,
      writtenIds: ["4351"],
      prunedIds: records(256).map(({ id }) => id),
    });
    expect(retained).toHaveLength(4096);
    expect(retained.map(({ id }) => Number(id)).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 4096 }, (_, index) => index + 256)
    );
  });

  it("skips unchanged identities without a physical put", async () => {
    const indexedDb = createTestIndexedDb();
    const store = createLearnedMonsterIndexedDbAdapter({ indexedDb, dbName: "learned" });
    await store.upsertMany("incomingBurst", records(1), BUDGET);
    const puts = indexedDb.operations.puts;

    await expect(
      store.upsertMany("incomingBurst", [{ ...records(1)[0], lastUsed: 999 }], BUDGET)
    ).resolves.toMatchObject({ outcome: StorageWriteOutcome.SKIPPED_UNCHANGED });
    expect(indexedDb.operations.puts).toBe(puts);
  });

  it("keeps world-bound databases isolated", async () => {
    const indexedDb = createTestIndexedDb();
    const persistent = createLearnedMonsterIndexedDbAdapter({ indexedDb, dbName: "learned" });
    const isekai = createLearnedMonsterIndexedDbAdapter({ indexedDb, dbName: "learned_isekai" });

    await persistent.upsertMany("bigKill", records(1), BUDGET);

    await expect(persistent.list("bigKill")).resolves.toHaveLength(1);
    await expect(isekai.list("bigKill")).resolves.toHaveLength(0);
  });
});
