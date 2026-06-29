import { describe, expect, it } from "vitest";
import { decideBuff } from "./decide-buff.js";

const snap = (over = {}) => ({
  opt: enabled(),
  conditionFacts: {
    hp: 1,
    mp: 1,
    sp: 1,
  },
  spiritOn: false,
  skillReady: {},
  playerBuffs: [],
  playerEffectTurns: {},
  ...over,
});

const enabled = (over = {}) => ({
  buffSkillSwitch: true,
  buffSkill: {},
  ...over,
});

describe("decideBuff", () => {
  it("buffSkillSwitch 未开 -> noop", () => {
    expect(
      decideBuff(
        snap({
          opt: { buffSkill: { Ha: true }, buffSkillOrderValue: "Ha" },
          skillReady: { 412: true },
        })
      )
    ).toEqual({ kind: "noop" });
  });

  it("buffSkillCondition 不满足 -> noop", () => {
    expect(
      decideBuff(
        snap({
          opt: enabled({
            buffSkill: { Ha: true },
            buffSkillOrderValue: "Ha",
            buffSkillCondition: [["hp,2,0.5"]],
          }),
          conditionFacts: { hp: 0.9 },
          skillReady: { 412: true },
        })
      )
    ).toEqual({ kind: "noop" });
  });

  it("buffSkill 未配置 -> noop", () => {
    expect(decideBuff(snap({ opt: { buffSkillSwitch: true } }))).toEqual({ kind: "noop" });
  });

  it("enabled buff spell ready and missing -> skill command", () => {
    expect(
      decideBuff(
        snap({
          opt: enabled({ buffSkill: { Ha: true }, buffSkillOrderValue: "Ha" }),
          skillReady: { 412: true },
        })
      )
    ).toEqual({ kind: "skill-command", skillId: "412" });
  });

  it("pre-cast Spirit gates before buff spell", () => {
    expect(
      decideBuff(
        snap({
          opt: enabled({
            buffSkill: { Ha: true },
            buffSkillOrderValue: "Ha",
            preCastSS: true,
            preCastSSCondition: [["sp,1,0.5"]],
          }),
          conditionFacts: { hp: 1, mp: 1, sp: 0.8 },
          skillReady: { 412: true },
        })
      )
    ).toEqual({ kind: "toggle-spirit" });
  });

  it("enabled draught without active item buff -> item command", () => {
    expect(decideBuff(snap({ opt: enabled({ buffSkill: { HD: true } }) }))).toEqual({
      kind: "item-command",
      itemId: 11191,
    });
  });
});
