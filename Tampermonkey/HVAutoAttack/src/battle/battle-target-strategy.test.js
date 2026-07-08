import { describe, expect, it } from "vitest";
import { BattleTargetStrategyEvent, runBattleTargetStrategy } from "./battle-target-strategy.js";

const monster = (over = {}) => ({
  id: 1,
  order: 0,
  isDead: false,
  isBoss: false,
  buffs: [],
  hpAbsNow: 100,
  finWeight: 1,
  ...over,
});

describe("runBattleTargetStrategy", () => {
  it("routes priority target queries through one entry", () => {
    const alive = [
      monster({ id: 1, order: 2, hpAbsNow: 300, finWeight: 5 }),
      monster({ id: 2, order: 0, hpAbsNow: 900, finWeight: 8 }),
      monster({ id: 3, order: 1, hpAbsNow: 700, finWeight: 2 }),
    ];

    expect(
      runBattleTargetStrategy({ type: BattleTargetStrategyEvent.FIRST_BY_FIN_WEIGHT, alive }).id
    ).toBe(3);
    expect(
      runBattleTargetStrategy({ type: BattleTargetStrategyEvent.FIRST_BY_ORDER, alive }).id
    ).toBe(2);
    expect(
      runBattleTargetStrategy({ type: BattleTargetStrategyEvent.HIGHEST_ABS_HP, alive }).id
    ).toBe(2);
  });

  it("routes explicit target id and AoE anchor decisions through one entry", () => {
    const self = monster({ id: 7 });
    expect(
      runBattleTargetStrategy({ type: BattleTargetStrategyEvent.SELF_TARGET, monster: self })
    ).toBe(7);
    expect(
      runBattleTargetStrategy({
        type: BattleTargetStrategyEvent.AOE_NEIGHBOR_ANCHOR,
        monster: self,
        nextMonster: monster({ id: 8 }),
        aoeCount: 2,
      })
    ).toBe(8);
  });

  it("routes boss coverage window decisions through one entry", () => {
    const alive = [
      monster({ id: 1, order: 0, isBoss: true }),
      monster({ id: 2, order: 1, isBoss: true }),
    ];
    const result = runBattleTargetStrategy({
      type: BattleTargetStrategyEvent.BOSS_COVERAGE_WINDOW,
      alive,
      aoe: 2,
      isNeedy: (m) => m.isBoss && !m.buffs.includes("imperil"),
    });
    expect(result.id).toBe(2);
  });

  it("rejects invalid target strategy events", () => {
    expect(runBattleTargetStrategy({ type: "unknown" })).toBeUndefined();
    expect(runBattleTargetStrategy(null)).toBeUndefined();
  });
});
