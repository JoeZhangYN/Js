import { describe, expect, it } from "vitest";
import { decideDeSkill } from "./decide-de-skill.js";

function snap(over = {}) {
  return {
    skillReady: { 211: true },
    spellAoe: {},
    view: [
      {
        id: 1,
        order: 0,
        isDead: false,
        hpPercent: 0.8,
        hpAbsNow: 1000,
        buffEffects: [],
      },
    ],
    ...over,
  };
}

const enabled = (over = {}) => ({
  debuffSkillSwitch: true,
  debuffSkill: {},
  ...over,
});

function deSkillFacts(s) {
  return {
    conditionFacts: s,
    skillReady: s.skillReady,
    spellAoe: s.spellAoe,
    overcharge: s.oc,
    roundNow: s.roundNow,
    roundAll: s.roundAll,
    monsterFacts: s.view,
    stallActive: s.stallActive,
  };
}

function decide(opt, s) {
  return decideDeSkill({ opt, ...deSkillFacts(s) });
}

describe("decideDeSkill entry gate", () => {
  it("debuffSkillSwitch off -> noop", () => {
    expect(decide({ debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } }, snap())).toEqual({
      kind: "noop",
    });
  });

  it("debuffSkillCondition unmet -> noop", () => {
    expect(
      decide(
        enabled({
          debuffSkillOrderValue: "Dr",
          debuffSkill: { Dr: true },
          debuffSkillCondition: [["hp,2,0.5"]],
        }),
        snap({ hp: 0.9 })
      )
    ).toEqual({ kind: "noop" });
  });

  it("stall active -> noop", () => {
    expect(
      decide(
        enabled({ debuffSkillOrderValue: "Dr", debuffSkill: { Dr: true } }),
        snap({ stallActive: true })
      )
    ).toEqual({ kind: "noop" });
  });
});
