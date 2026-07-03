import { describe, expect, it } from "vitest";
import { applyBattleActionUsageStats } from "./record-usage-action-stats.js";
import { createDefaultUsageStats } from "./record-usage-default-stats.js";

function line(text, className = "") {
  return { className, textContent: text };
}

describe("applyBattleActionUsageStats", () => {
  it("records selected magic, round progress, damage, restore, and proficiency", () => {
    const stats = createDefaultUsageStats();

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

  it("stops reading battle log lines at the tls marker token", () => {
    const stats = createDefaultUsageStats();

    applyBattleActionUsageStats(
      stats,
      {
        mode: "attack",
        log: [
          line("You evade the attack"),
          line("ignored", "tls extra"),
          line("You gain the effect Focusing"),
        ],
      },
      { monsterAlive: 1, roundAll: 3, roundNow: 2, turn: 4 }
    );

    expect(stats.self.attack).toBe(1);
    expect(stats.self.evade).toBe(1);
    expect(stats.self.focus).toBe(0);
  });

  it("fails closed for malformed broad-match usage log lines", () => {
    const stats = createDefaultUsageStats();

    expect(() =>
      applyBattleActionUsageStats(
        stats,
        {
          mode: "attack",
          log: [
            line("Something drain 10 points of Spirit"),
            line("You gain Elemental proficiency"),
          ],
        },
        { monsterAlive: 1, roundAll: 3, roundNow: 2, turn: 4 }
      )
    ).not.toThrow();

    expect(stats.self.attack).toBe(1);
    expect(stats.restore).toEqual({});
    expect(stats.proficiency).toEqual({});
  });
});
