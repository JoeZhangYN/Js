import { describe, expect, it, vi } from "vitest";
import {
  createLearnedMonsterStoreCapability,
  LearnedMonsterFamily,
  LearnedMonsterStoreEvent,
} from "./learned-monster-store.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

const family = LearnedMonsterFamily.BIG_KILL;
const event = (type, detail = {}) => ({ type, family, ...detail });

describe("learned monster store capability", () => {
  it("hydrates identities only from the IndexedDB authority", async () => {
    const adapter = {
      list: vi.fn(async () => [
        { id: "1", value: { score: "indexed" } },
        { id: "3", value: { score: "indexed-only" } },
      ]),
      upsertMany: vi.fn(),
    };
    const store = createLearnedMonsterStoreCapability(
      { dbName: "learned", sourceIdentity: "persistent" },
      { adapter, recordIo: vi.fn() }
    );

    await store.run(event(LearnedMonsterStoreEvent.HYDRATE));

    expect(store.run(event(LearnedMonsterStoreEvent.READ_MAP))).toEqual({
      1: { score: "indexed" },
      3: { score: "indexed-only" },
    });
  });

  it("returns a typed failure for strict maintenance reads", async () => {
    const store = createLearnedMonsterStoreCapability(
      { dbName: "learned", sourceIdentity: "persistent" },
      {
        adapter: { list: vi.fn(async () => Promise.reject(new Error("read blocked"))) },
        recordIo: vi.fn(),
      }
    );

    await expect(store.run(event(LearnedMonsterStoreEvent.READ_RECORDS))).resolves.toMatchObject({
      outcome: StorageWriteOutcome.FAILED,
      error: expect.objectContaining({ message: "read blocked" }),
    });
  });

  it("does not roll a newer cached identity back when an older write fails later", async () => {
    let rejectFirst;
    const adapter = {
      list: vi.fn(async () => []),
      upsertMany: vi
        .fn()
        .mockImplementationOnce(
          () => new Promise((resolve, reject) => (rejectFirst = () => reject(new Error("late"))))
        )
        .mockResolvedValueOnce({ outcome: StorageWriteOutcome.WRITTEN, prunedIds: [] }),
    };
    const store = createLearnedMonsterStoreCapability(
      { dbName: "learned", sourceIdentity: "persistent" },
      { adapter, recordIo: vi.fn(), now: () => 1 }
    );
    const first = store.run(
      event(LearnedMonsterStoreEvent.UPSERT_MANY, { records: [{ id: 1, value: { score: 1 } }] })
    );
    await store.run(
      event(LearnedMonsterStoreEvent.UPSERT_MANY, { records: [{ id: 1, value: { score: 2 } }] })
    );
    rejectFirst();

    await expect(first).resolves.toMatchObject({ outcome: StorageWriteOutcome.FAILED });
    expect(store.run(event(LearnedMonsterStoreEvent.READ_MAP))).toEqual({ 1: { score: 2 } });
  });
});
