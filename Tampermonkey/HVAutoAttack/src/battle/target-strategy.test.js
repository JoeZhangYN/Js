// target-strategy 具名策略回归锁。
import { describe, it, expect } from "vitest";
import { BattleTargetStrategyEvent, runBattleTargetStrategy } from "./battle-target-strategy.js";

const m = (over = {}) => ({
  id: 1,
  order: 0,
  isDead: false,
  isBoss: false,
  buffs: [],
  hpAbsNow: 1000,
  hpPercent: 1,
  finWeight: 1,
  ...over,
});

describe("firstByFinWeight", () => {
  it("选 finWeight 最小", () => {
    const alive = [
      m({ id: 1, finWeight: 5 }),
      m({ id: 2, finWeight: 2 }),
      m({ id: 3, finWeight: 9 }),
    ];
    const r = runBattleTargetStrategy({ type: BattleTargetStrategyEvent.FIRST_BY_FIN_WEIGHT, alive });
    expect(r.id).toBe(2);
  });
  it("空 → undefined", () => {
    expect(
      runBattleTargetStrategy({ type: BattleTargetStrategyEvent.FIRST_BY_FIN_WEIGHT, alive: [] })
    ).toBeUndefined();
  });
});

describe("firstByOrder", () => {
  it("选 order 最小", () => {
    const alive = [
      m({ id: 1, order: 2 }),
      m({ id: 2, order: 0 }),
      m({ id: 3, order: 1 }),
    ];
    const r = runBattleTargetStrategy({ type: BattleTargetStrategyEvent.FIRST_BY_ORDER, alive });
    expect(r.id).toBe(2);
  });
});

describe("highestAbsHp", () => {
  it("选 hpAbsNow 最大(绝对血)", () => {
    const alive = [
      m({ id: 1, hpAbsNow: 300 }),
      m({ id: 2, hpAbsNow: 9000 }),
      m({ id: 3, hpAbsNow: 500 }),
    ];
    const r = runBattleTargetStrategy({ type: BattleTargetStrategyEvent.HIGHEST_ABS_HP, alive });
    expect(r.id).toBe(2);
  });
  it("根因回归：满血小怪 hpPercent 高但 hpAbsNow 低 → 仍选 hpAbsNow 高的 boss", () => {
    const smallFull = m({ id: 1, order: 0, hpPercent: 1.0, hpAbsNow: 800 }); // 满血小怪
    const bossHurt = m({ id: 2, order: 1, isBoss: true, hpPercent: 0.6, hpAbsNow: 30000 }); // 被打过的 boss
    const r = runBattleTargetStrategy({
      type: BattleTargetStrategyEvent.HIGHEST_ABS_HP,
      alive: [smallFull, bossHurt],
    });
    expect(r.id).toBe(2);
  });
  it("hpAbsNow 相同 → 取 order 最小(稳定)", () => {
    const alive = [
      m({ id: 1, order: 1, hpAbsNow: 500 }),
      m({ id: 2, order: 0, hpAbsNow: 500 }),
    ];
    const r = runBattleTargetStrategy({ type: BattleTargetStrategyEvent.HIGHEST_ABS_HP, alive });
    expect(r.id).toBe(2);
  });
});

describe("selfTarget", () => {
  it("恒返自身 id(无邻居偏移)", () => {
    expect(
      runBattleTargetStrategy({
        type: BattleTargetStrategyEvent.SELF_TARGET,
        monster: m({ id: 7 }),
      })
    ).toBe(7);
  });
});

describe("aoeNeighborAnchor", () => {
  const self = { id: 1 };
  it("AoE≥2 且邻居存活 → 邻居 id", () => {
    expect(
      runBattleTargetStrategy({
        type: BattleTargetStrategyEvent.AOE_NEIGHBOR_ANCHOR,
        monster: self,
        nextMonster: { id: 2, isDead: false },
        aoeCount: 2,
      })
    ).toBe(2);
  });
  it("AoE<2 → self", () => {
    expect(anchorTargetId(self, { id: 2, isDead: false }, 1)).toBe(1);
  });
  it("邻居已死 → self", () => expect(anchorTargetId(self, { id: 2, isDead: true }, 2)).toBe(1));
  it("无邻居 → self", () => expect(anchorTargetId(self, undefined, 2)).toBe(1));
});

describe("bossCoverageWindow", () => {
  const needy = (x) => x.isBoss && !x.buffs.includes("imperil");
  it("单 needy boss → 命中它", () => {
    const r = bossWindow([m({ id: 7, order: 0, isBoss: true })], 1, needy);
    expect(r.id).toBe(7);
  });
  it("aoe=2 相邻两 needy boss → click 后者覆盖 [前,后]", () => {
    const alive = [m({ id: 1, order: 0, isBoss: true }), m({ id: 2, order: 1, isBoss: true })];
    expect(bossWindow(alive, 2, needy).id).toBe(2);
  });
  it("aoe=1 两不相邻 needy → 选 order 较小", () => {
    const alive = [
      m({ id: 1, order: 0, isBoss: true }),
      m({ id: 2, order: 1, isBoss: false }),
      m({ id: 3, order: 2, isBoss: true }),
    ];
    expect(bossWindow(alive, 1, needy).id).toBe(1);
  });
  it("tie-break: cov 相同优先 needy 自身", () => {
    const alive = [
      m({ id: 1, order: 0, isBoss: false }),
      m({ id: 2, order: 1, isBoss: true }),
      m({ id: 3, order: 2, isBoss: false }),
    ];
    expect(bossWindow(alive, 2, needy).id).toBe(2);
  });
  it("无 needy → null", () => {
    expect(bossWindow([m({ isBoss: false })], 2, needy)).toBeNull();
  });
});

function anchorTargetId(monster, nextMonster, aoeCount) {
  return runBattleTargetStrategy({
    type: BattleTargetStrategyEvent.AOE_NEIGHBOR_ANCHOR,
    monster,
    nextMonster,
    aoeCount,
  });
}

function bossWindow(alive, aoe, isNeedy) {
  return runBattleTargetStrategy({
    type: BattleTargetStrategyEvent.BOSS_COVERAGE_WINDOW,
    alive,
    aoe,
    isNeedy,
  });
}
