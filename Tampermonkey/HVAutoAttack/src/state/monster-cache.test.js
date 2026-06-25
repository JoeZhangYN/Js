// monster-cache 回归锁：预取/同步读/即时写/去重/失败降级。getMonster(IndexedDB) 被 mock。
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./monster-db-store.js", () => ({ getMonster: vi.fn() }));
import { getMonster } from "./monster-db-store.js";
import {
  primeMonsterCache, getCachedMonster, getCachedDb, setCachedMonster, _clearMonsterCache,
} from "./monster-cache.js";

beforeEach(() => {
  _clearMonsterCache();
  vi.mocked(getMonster).mockReset();
});

describe("monster-cache", () => {
  it("prime 后 getCachedMonster 拿到库记录", async () => {
    vi.mocked(getMonster).mockImplementation(async (n) => ({ monsterName: n, plvl: 100 }));
    await primeMonsterCache(["A", "B"]);
    expect(getCachedMonster("A")).toEqual({ monsterName: "A", plvl: 100 });
    expect(getCachedMonster("B").plvl).toBe(100);
  });

  it("getCachedDb 返回怪名→记录 Record（供 join 的 dbByName）", async () => {
    vi.mocked(getMonster).mockImplementation(async (n) => ({ monsterName: n }));
    await primeMonsterCache(["A", "B"]);
    expect(getCachedDb()).toEqual({ A: { monsterName: "A" }, B: { monsterName: "B" } });
  });

  it("去重：同名只查一次", async () => {
    vi.mocked(getMonster).mockResolvedValue(null);
    await primeMonsterCache(["A", "A", "A"]);
    expect(getMonster).toHaveBeenCalledTimes(1);
  });

  it("getMonster 失败 → 存 null 不抛", async () => {
    vi.mocked(getMonster).mockRejectedValue(new Error("idb fail"));
    await expect(primeMonsterCache(["A"])).resolves.toBeUndefined();
    expect(getCachedMonster("A")).toBeNull();
  });

  it("未预取 → getCachedMonster null", () => {
    expect(getCachedMonster("Z")).toBeNull();
  });

  it("setCachedMonster 即时写入(scan 入库路径)", () => {
    setCachedMonster("C", { monsterName: "C", fire: 50 });
    expect(getCachedMonster("C").fire).toBe(50);
    expect(getCachedDb().C.fire).toBe(50);
  });

  it("空/缺 names 安全", async () => {
    await expect(primeMonsterCache()).resolves.toBeUndefined();
    await expect(primeMonsterCache([null, ""])).resolves.toBeUndefined();
  });
});
