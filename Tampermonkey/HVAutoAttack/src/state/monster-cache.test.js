// monster-cache 回归锁：预取/同步读/即时写/去重/失败降级。**键=monsterId(MID)**；getMonsterById 被 mock。
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./monster-db-store.js", () => ({ getMonsterById: vi.fn() }));
import { getMonsterById } from "./monster-db-store.js";
import {
  primeMonsterCache,
  getCachedMonster,
  getCachedDb,
  setCachedMonster,
  _clearMonsterCache,
} from "./monster-cache.js";

beforeEach(() => {
  _clearMonsterCache();
  vi.mocked(getMonsterById).mockReset();
});

describe("monster-cache（按 MID 键）", () => {
  it("prime 后 getCachedMonster(MID) 拿到画像", async () => {
    vi.mocked(getMonsterById).mockImplementation(async (id) => ({ monsterId: id, plvl: 100 }));
    await primeMonsterCache([158322, 156409]);
    expect(getCachedMonster(158322)).toEqual({ monsterId: 158322, plvl: 100 });
    expect(getCachedMonster(156409).plvl).toBe(100);
  });

  it("getCachedDb 返回 MID→记录 Record（供 join 的 dbById）", async () => {
    vi.mocked(getMonsterById).mockImplementation(async (id) => ({ monsterId: id }));
    await primeMonsterCache([1, 2]);
    expect(getCachedDb()).toEqual({ 1: { monsterId: 1 }, 2: { monsterId: 2 } });
  });

  it("去重：同 MID 只查一次", async () => {
    vi.mocked(getMonsterById).mockResolvedValue(null);
    await primeMonsterCache([7, 7, 7]);
    expect(getMonsterById).toHaveBeenCalledTimes(1);
  });

  it("getMonsterById 失败 → 存 null 不抛", async () => {
    vi.mocked(getMonsterById).mockRejectedValue(new Error("idb fail"));
    await expect(primeMonsterCache([7])).resolves.toBeUndefined();
    expect(getCachedMonster(7)).toBeNull();
  });

  it("未预取 / 无 MID → getCachedMonster null", () => {
    expect(getCachedMonster(999)).toBeNull();
    expect(getCachedMonster(undefined)).toBeNull();
    expect(getCachedMonster(null)).toBeNull();
  });

  it("setCachedMonster 即时写入(scan 入库路径)", () => {
    setCachedMonster(80804, { monsterId: 80804, fire: 50 });
    expect(getCachedMonster(80804).fire).toBe(50);
    expect(getCachedDb()[80804].fire).toBe(50);
  });

  it("空/缺 ids + undefined/null 元素 安全", async () => {
    await expect(primeMonsterCache()).resolves.toBeUndefined();
    await expect(primeMonsterCache([null, undefined])).resolves.toBeUndefined();
    expect(getMonsterById).not.toHaveBeenCalled();
  });
});
