// monsterHpVars 纯函数回归锁：非门"濒死守卫"依赖的单怪 HP% 派生量。
import { describe, it, expect } from "vitest";
import { monsterHpVars } from "./snapshot.js";

const M = (order, hpRatio, isDead = false) => ({ order, hpRatio, isDead });

describe("monsterHpVars", () => {
  it("无存活怪 → 全 100（守卫不误伤）", () => {
    expect(monsterHpVars([M(0, 0.5, true)])).toEqual({
      soloMonsterHp: 100,
      lowestMonsterHp: 100,
      firstMonsterHp: 100,
    });
  });

  it("仅 1 怪存活 → soloMonsterHp = 该怪 HP%", () => {
    expect(monsterHpVars([M(2, 0.2)])).toEqual({
      soloMonsterHp: 20,
      lowestMonsterHp: 20,
      firstMonsterHp: 20,
    });
  });

  it("多怪存活 → soloMonsterHp 退 100；lowest/first 仍生效", () => {
    const r = monsterHpVars([M(3, 0.8), M(1, 0.3), M(2, 0.5)]);
    expect(r.soloMonsterHp).toBe(100); // 非独怪
    expect(r.lowestMonsterHp).toBe(30); // 最低血
    expect(r.firstMonsterHp).toBe(30); // order 最小 = order 1，HP 0.3
  });

  it("死怪被排除：1 活 1 死 → 视为独怪", () => {
    const r = monsterHpVars([M(0, 0.1), M(1, 0.9, true)]);
    expect(r.soloMonsterHp).toBe(10);
  });
});
