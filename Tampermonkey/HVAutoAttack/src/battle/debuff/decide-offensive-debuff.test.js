import { describe, expect, it } from "vitest";
import { decideOffensiveDebuff } from "./decide-offensive-debuff.js";

function monster(over = {}) {
  return {
    id: 1,
    order: 0,
    monsterId: 77,
    isDead: false,
    isBoss: false,
    buffs: [],
    buffEffects: [],
    hpAbs: 1000,
    hpAbsNow: 1000,
    hpPercent: 0.6,
    ...over,
  };
}

function snap(over = {}) {
  return {
    hpAbs: 100,
    oc: 0,
    roundNow: undefined,
    roundAll: undefined,
    cdMap: {},
    spellAoe: {},
    healthAbs: 100,
    monsterAlive: 1,
    view: [monster()],
    skillReady: {},
    ...over,
  };
}

describe("decideOffensiveDebuff", () => {
  it("uses burst control before boss imperil", () => {
    expect(
      decideOffensiveDebuff(
        snap({
          learnedBurstByMid: { 77: { maxHit: 100, type: "fire" } },
          skillReady: { 232: true, 213: true },
          view: [monster({ isBoss: true })],
        }),
        { burstControlSwitch: true, debuffSkillSwitch: true }
      )
    ).toEqual({ kind: "click-skill-then-target", skillId: "232", targetId: 1 });
  });

  it("uses boss imperil before all-target debuffs", () => {
    expect(
      decideOffensiveDebuff(
        snap({
          skillReady: { 213: true, 212: true },
          view: [monster({ isBoss: true })],
        }),
        { debuffSkillSwitch: true, debuffSkillAllWk: true }
      )
    ).toEqual({ kind: "click-skill-then-target", skillId: "213", targetId: 1 });
  });

  it("uses all-target Weaken before single-target debuffs", () => {
    expect(
      decideOffensiveDebuff(
        snap({
          skillReady: { 212: true, 211: true },
        }),
        {
          debuffSkillSwitch: true,
          debuffSkillAllWk: true,
          debuffSkill: { Dr: true },
          debuffSkillOrderValue: "Dr",
        }
      )
    ).toEqual({ kind: "click-skill-then-target", skillId: "212", targetId: 1 });
  });
});
