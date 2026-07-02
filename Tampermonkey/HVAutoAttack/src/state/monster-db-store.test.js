import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadStoreWithIndexedDb, makeFakeIndexedDb } from "./monster-db-store-test-fixture.js";

beforeEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("runMonsterDbStoreAutomation failure boundary", () => {
  it("rejects unknown and null store events without reading or changing persisted profiles", async () => {
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } =
      await loadStoreWithIndexedDb(makeFakeIndexedDb());

    await runMonsterDbStoreAutomation({
      type: MonsterDbStoreEvent.PROFILE_WRITE,
      info: { monsterId: 99, fire: 50 },
    });

    expect(
      await runMonsterDbStoreAutomation({ type: "unknown", info: { monsterId: 99, fire: 0 } })
    ).toBeUndefined();
    expect(await runMonsterDbStoreAutomation(null)).toBeUndefined();
    expect(
      await runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_READ, monsterId: 99 })
    ).toEqual({ monsterId: 99, fire: 50 });
  });

  it("does not open IndexedDB for unknown or null store events", async () => {
    vi.resetModules();
    const fakeIndexedDb = makeFakeIndexedDb();
    const open = vi.spyOn(fakeIndexedDb, "open");
    globalThis.indexedDB = fakeIndexedDb;
    const { runMonsterDbStoreAutomation } = await import("./monster-db-store.js");

    expect(await runMonsterDbStoreAutomation({ type: "unknown" })).toBeUndefined();
    expect(await runMonsterDbStoreAutomation(null)).toBeUndefined();
    expect(open).not.toHaveBeenCalled();
  });

  it("classifies IndexedDB open failures and allows a later open retry", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const open = vi.fn();
    const failingIndexedDb = {
      open: () => {
        open();
        const req = { result: null, error: new Error("open blocked"), onerror: null };
        setTimeout(() => req.onerror?.(), 0);
        return req;
      },
    };
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } =
      await loadStoreWithIndexedDb(failingIndexedDb);

    await expect(
      runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_IS_EMPTY })
    ).rejects.toMatchObject({
      failure: expect.objectContaining({
        source: "monsterDbStore",
        stage: "open",
        dbName: expect.any(String),
        dbVersion: expect.any(Number),
        error: "open blocked",
      }),
    });
    await expect(
      runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_IS_EMPTY })
    ).rejects.toMatchObject({ failure: expect.objectContaining({ stage: "open" }) });
    expect(open).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] monster db store failed",
      expect.objectContaining({ stage: "open" })
    );
  });

  it("classifies transaction start failures", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fakeIndexedDb = {
      open: () => {
        const req = {
          result: {
            transaction: () => {
              throw new Error("transaction blocked");
            },
          },
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null,
        };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      },
    };
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } =
      await loadStoreWithIndexedDb(fakeIndexedDb);

    await expect(
      runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_READ, monsterId: 1 })
    ).rejects.toMatchObject({
      failure: expect.objectContaining({
        source: "monsterDbStore",
        stage: "transaction-start",
        storeName: "monsterProfile",
        mode: "readonly",
        error: "transaction blocked",
      }),
    });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] monster db store failed",
      expect.objectContaining({ stage: "transaction-start" })
    );
  });

  it("classifies transaction abort failures", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const abortingIndexedDb = {
      open: () => {
        const db = {
          objectStoreNames: { contains: () => true },
          transaction: () => {
            const tx = {
              error: new Error("abort blocked"),
              oncomplete: null,
              onerror: null,
              onabort: null,
              objectStore: () => ({ get: () => ({ result: null }) }),
            };
            setTimeout(() => tx.onabort?.(), 0);
            return tx;
          },
        };
        const req = { result: db, onupgradeneeded: null, onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      },
    };
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } =
      await loadStoreWithIndexedDb(abortingIndexedDb);

    await expect(
      runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_READ, monsterId: 1 })
    ).rejects.toMatchObject({
      failure: expect.objectContaining({
        source: "monsterDbStore",
        stage: "transaction-abort",
        storeName: "monsterProfile",
        mode: "readonly",
        error: "abort blocked",
      }),
    });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] monster db store failed",
      expect.objectContaining({ stage: "transaction-abort" })
    );
  });
});
