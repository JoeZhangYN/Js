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
    hpPercent: 0.6,
    ...over,
  };
}

function event(over = {}) {
  return {
    opt: {},
    conditionFacts: {},
    healthAbs: 100,
    monsterAlive: 1,
    monsterFacts: [monster()],
    skillReady: {},
    ...over,
  };
}

describe("decideOffensiveDebuff", () => {
  it("uses burst control before boss imperil", () => {
    expect(
      decideOffensiveDebuff(
        event({
          opt: { burstControlSwitch: true, debuffSkillSwitch: true },
          learnedBurstByMid: { 77: { maxHit: 100, type: "fire" } },
          skillReady: { 232: true, 213: true },
          monsterFacts: [monster({ isBoss: true })],
        })
      )
    ).toEqual({ kind: "click-skill-then-target", skillId: "232", targetId: 1 });
  });

  it("uses boss imperil before all-target debuffs", () => {
    expect(
      decideOffensiveDebuff(
        event({
          opt: { debuffSkillSwitch: true, debuffSkillAllWk: true },
          skillReady: { 213: true, 212: true },
          imperilSkillReady: true,
          monsterFacts: [monster({ isBoss: true })],
        })
      )
    ).toEqual({ kind: "click-skill-then-target", skillId: "213", targetId: 1 });
  });

  it("uses all-target Weaken before single-target debuffs", () => {
    expect(
      decideOffensiveDebuff(
        event({
          opt: {
            debuffSkillSwitch: true,
            debuffSkillAllWk: true,
            debuffSkill: { Dr: true },
            debuffSkillOrderValue: "Dr",
          },
          skillReady: { 212: true, 211: true },
        })
      )
    ).toEqual({ kind: "click-skill-then-target", skillId: "212", targetId: 1 });
  });
});
