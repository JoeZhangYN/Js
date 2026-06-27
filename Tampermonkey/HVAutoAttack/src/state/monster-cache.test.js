// monster-cache 回归锁：预取/同步读/即时写/去重/失败降级。**键=monsterId(MID)**；store entry 被 mock。
import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runMonsterDbStoreAutomation: vi.fn(),
}));

vi.mock("./monster-db-store.js", () => ({
  MonsterDbStoreEvent: Object.freeze({ PROFILE_READ: "profileRead" }),
  runMonsterDbStoreAutomation: mocks.runMonsterDbStoreAutomation,
}));
import { MonsterCacheEvent, runMonsterCacheAutomation } from "./monster-cache.js";

beforeEach(() => {
  runMonsterCacheAutomation({ type: MonsterCacheEvent.CLEAR });
  mocks.runMonsterDbStoreAutomation.mockReset();
});

describe("monster-cache（按 MID 键）", () => {
  it("primes and reads one monster profile through the cache entry", async () => {
    mocks.runMonsterDbStoreAutomation.mockImplementation(async (event) => ({
      monsterId: event.monsterId,
      plvl: 100,
    }));
    await runMonsterCacheAutomation({
      type: MonsterCacheEvent.PRIME_PROFILES,
      monsterIds: [158322, 156409],
    });
    expect(
      runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_PROFILE, monsterId: 158322 })
    ).toEqual({ monsterId: 158322, plvl: 100 });
    expect(
      runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_PROFILE, monsterId: 156409 }).plvl
    ).toBe(100);
  });

  it("reads the cached db snapshot through the cache entry", async () => {
    mocks.runMonsterDbStoreAutomation.mockImplementation(async (event) => ({
      monsterId: event.monsterId,
    }));
    await runMonsterCacheAutomation({
      type: MonsterCacheEvent.PRIME_PROFILES,
      monsterIds: [1, 2],
    });
    expect(runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_DB })).toEqual({
      1: { monsterId: 1 },
      2: { monsterId: 2 },
    });
  });

  it("去重：同 MID 只查一次", async () => {
    mocks.runMonsterDbStoreAutomation.mockResolvedValue(null);
    await runMonsterCacheAutomation({
      type: MonsterCacheEvent.PRIME_PROFILES,
      monsterIds: [7, 7, 7],
    });
    expect(mocks.runMonsterDbStoreAutomation).toHaveBeenCalledTimes(1);
    expect(mocks.runMonsterDbStoreAutomation).toHaveBeenCalledWith({
      type: "profileRead",
      monsterId: 7,
    });
  });

  it("store read 失败 → 存 null 不抛", async () => {
    mocks.runMonsterDbStoreAutomation.mockRejectedValue(new Error("idb fail"));
    await expect(
      runMonsterCacheAutomation({ type: MonsterCacheEvent.PRIME_PROFILES, monsterIds: [7] })
    ).resolves.toBeUndefined();
    expect(
      runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_PROFILE, monsterId: 7 })
    ).toBeNull();
  });

  it("returns null for missing or absent monster ids", () => {
    expect(runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_PROFILE, monsterId: 999 })).toBeNull();
    expect(
      runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_PROFILE, monsterId: undefined })
    ).toBeNull();
    expect(runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_PROFILE, monsterId: null })).toBeNull();
  });

  it("writes a freshly scanned profile through the cache entry", () => {
    runMonsterCacheAutomation({
      type: MonsterCacheEvent.WRITE_PROFILE,
      monsterId: 80804,
      info: { monsterId: 80804, fire: 50 },
    });
    expect(
      runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_PROFILE, monsterId: 80804 }).fire
    ).toBe(50);
    expect(runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_DB })[80804].fire).toBe(50);
  });

  it("空/缺 ids + undefined/null 元素 安全", async () => {
    await expect(
      runMonsterCacheAutomation({ type: MonsterCacheEvent.PRIME_PROFILES })
    ).resolves.toBeUndefined();
    await expect(
      runMonsterCacheAutomation({
        type: MonsterCacheEvent.PRIME_PROFILES,
        monsterIds: [null, undefined],
      })
    ).resolves.toBeUndefined();
    expect(mocks.runMonsterDbStoreAutomation).not.toHaveBeenCalled();
  });
});
