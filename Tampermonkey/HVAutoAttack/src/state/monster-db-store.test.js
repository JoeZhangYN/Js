import { beforeEach, describe, expect, it, vi } from "vitest";

function makeFakeIndexedDb() {
  const stores = new Map();
  const objectStoreNames = {
    contains: (name) => stores.has(name),
  };
  const ensureStore = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };
  const db = {
    objectStoreNames,
    createObjectStore: (name) => ensureStore(name),
    deleteObjectStore: (name) => stores.delete(name),
    transaction: (storeName) => {
      const tx = {
        oncomplete: null,
        onerror: null,
        onabort: null,
        objectStore: () => {
          const store = ensureStore(storeName);
          return {
            get: (key) => ({ result: store.get(key) }),
            put: (value, key) => {
              store.set(key, value);
              return { result: undefined };
            },
            count: () => ({ result: store.size }),
          };
        },
      };
      setTimeout(() => tx.oncomplete?.(), 0);
      return tx;
    },
  };
  return {
    open: () => {
      const req = { result: db, error: null, onupgradeneeded: null, onsuccess: null, onerror: null };
      setTimeout(() => {
        req.onupgradeneeded?.();
        req.onsuccess?.();
      }, 0);
      return req;
    },
  };
}

async function loadStore() {
  vi.resetModules();
  globalThis.indexedDB = makeFakeIndexedDb();
  return import("./monster-db-store.js");
}

beforeEach(() => {
  vi.useRealTimers();
});

describe("runMonsterDbStoreAutomation", () => {
  it("reads and writes monster profiles through one event entry", async () => {
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } = await loadStore();

    expect(
      await runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_IS_EMPTY })
    ).toBe(true);
    await runMonsterDbStoreAutomation({
      type: MonsterDbStoreEvent.PROFILE_WRITE,
      info: { monsterId: 84361, monsterName: "Ariel", fire: 50 },
    });

    expect(
      await runMonsterDbStoreAutomation({
        type: MonsterDbStoreEvent.PROFILE_READ,
        monsterId: 84361,
      })
    ).toMatchObject({ monsterId: 84361, fire: 50 });
    expect(
      await runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_IS_EMPTY })
    ).toBe(false);
  });

  it("bulk writes only keyed monster profiles", async () => {
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } = await loadStore();

    await runMonsterDbStoreAutomation({
      type: MonsterDbStoreEvent.PROFILE_BULK_WRITE,
      infos: [{ monsterId: 1, fire: 10 }, { monsterName: "missing-mid" }, { monsterId: 2 }],
    });

    expect(
      await runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_READ, monsterId: 1 })
    ).toEqual({ monsterId: 1, fire: 10 });
    expect(
      await runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_READ, monsterId: 2 })
    ).toEqual({ monsterId: 2 });
  });

  it("keeps hp records keyed by monster id and level", async () => {
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } = await loadStore();

    await runMonsterDbStoreAutomation({
      type: MonsterDbStoreEvent.HP_WRITE,
      monsterId: 7,
      level: 500,
      maxHP: 123456,
      lastUpdate: "2026-06-27",
    });

    expect(
      await runMonsterDbStoreAutomation({
        type: MonsterDbStoreEvent.HP_READ,
        monsterId: 7,
        level: 500,
      })
    ).toEqual({ monsterId: 7, level: 500, maxHP: 123456, lastUpdate: "2026-06-27" });
    expect(
      await runMonsterDbStoreAutomation({
        type: MonsterDbStoreEvent.HP_READ,
        monsterId: 7,
        level: 501,
      })
    ).toBeNull();
  });

  it("reads and writes sync metadata through the same entry", async () => {
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } = await loadStore();

    await runMonsterDbStoreAutomation({
      type: MonsterDbStoreEvent.META_WRITE,
      key: "lastSync",
      value: "2026-06-27",
    });

    expect(
      await runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.META_READ, key: "lastSync" })
    ).toBe("2026-06-27");
  });

  it("rejects unknown and null store events without reading or changing persisted profiles", async () => {
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } = await loadStore();

    await runMonsterDbStoreAutomation({
      type: MonsterDbStoreEvent.PROFILE_WRITE,
      info: { monsterId: 99, fire: 50 },
    });

    expect(
      await runMonsterDbStoreAutomation({
        type: "unknown",
        info: { monsterId: 99, fire: 0 },
      })
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
});
