import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadStoreWithIndexedDb, makeFakeIndexedDb } from "./monster-db-store-test-fixture.js";

beforeEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("runMonsterDbStoreAutomation entry behavior", () => {
  it("reads and writes monster profiles through one event entry", async () => {
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } =
      await loadStoreWithIndexedDb(makeFakeIndexedDb());

    expect(await runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_IS_EMPTY })).toBe(
      true
    );
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
    expect(await runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_IS_EMPTY })).toBe(
      false
    );
  });

  it("bulk writes only keyed monster profiles", async () => {
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } =
      await loadStoreWithIndexedDb(makeFakeIndexedDb());

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
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } =
      await loadStoreWithIndexedDb(makeFakeIndexedDb());

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
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } =
      await loadStoreWithIndexedDb(makeFakeIndexedDb());

    await runMonsterDbStoreAutomation({
      type: MonsterDbStoreEvent.META_WRITE,
      key: "lastSync",
      value: "2026-06-27",
    });

    expect(
      await runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.META_READ, key: "lastSync" })
    ).toBe("2026-06-27");
  });
});
