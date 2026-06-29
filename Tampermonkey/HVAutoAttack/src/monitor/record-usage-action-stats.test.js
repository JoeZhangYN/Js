import { describe, expect, it } from "vitest";
import { applyBattleActionUsageStats } from "./record-usage-action-stats.js";

function usageStats() {
  return {
    self: {
      _turn: 0,
      _round: 0,
      _battle: 0,
      _monster: 0,
      _boss: 0,
      evade: 0,
      miss: 0,
      focus: 0,
    },
    restore: {},
    items: {},
    magic: {},
    damage: {},
    hurt: {
      mp: 0,
      oc: 0,
      _avg: 0,
      _count: 0,
      _total: 0,
      _mavg: 0,
      _mcount: 0,
      _mtotal: 0,
      _pavg: 0,
      _pcount: 0,
      _ptotal: 0,
    },
    proficiency: {},
  };
}

function line(text, className = "") {
  return { className, textContent: text };
}

describe("applyBattleActionUsageStats", () => {
  it("records selected magic, round progress, damage, restore, and proficiency", () => {
    const stats = usageStats();

    applyBattleActionUsageStats(
      stats,
      {
        mode: "magic",
        magic: "Fireball",
        mp: 12,
        oc: 3,
        log: [
          line("Monster hits you for 30 crushing damage"),
          line("You cast Fireball for 50 fire damage"),
          line("You are healed for 20 Health Points"),
          line("You gain 1.25 points of Elemental proficiency"),
        ],
      },
      { monsterAlive: 0, roundAll: 3, roundNow: 3, turn: 7 }
    );

    expect(stats.self).toMatchObject({ _battle: 1, _round: 1, _turn: 7 });
    expect(stats.magic.Fireball).toBe(1);
    expect(stats.damage.cast).toBe(50);
    expect(stats.restore.Fireball).toBe(20);
    expect(stats.proficiency.Elemental).toBe(1.25);
    expect(stats.hurt).toMatchObject({
      crush: 30,
      mp: 12,
      oc: 3,
      _count: 1,
      _pcount: 1,
      _ptotal: 30,
    });
  });

  it("stops reading battle log lines at the tls marker", () => {
    const stats = usageStats();

    applyBattleActionUsageStats(
      stats,
      {
        mode: "attack",
        log: [
          line("You evade the attack"),
          line("ignored", "tls"),
          line("You gain the effect Focusing"),
        ],
      },
      { monsterAlive: 1, roundAll: 3, roundNow: 2, turn: 4 }
    );

    expect(stats.self.attack).toBe(1);
    expect(stats.self.evade).toBe(1);
    expect(stats.self.focus).toBe(0);
  });
});
