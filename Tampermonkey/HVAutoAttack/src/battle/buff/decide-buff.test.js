import { describe, expect, it } from "vitest";
import { decideBuff } from "./decide-buff.js";

const snap = (over = {}) => ({
  hp: 1,
  mp: 1,
  sp: 1,
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
        { buffSkill: { Ha: true }, buffSkillOrderValue: "Ha" },
        snap({ skillReady: { 412: true } })
      )
    ).toEqual({ kind: "noop" });
  });

  it("buffSkillCondition 不满足 -> noop", () => {
    expect(
      decideBuff(
        enabled({
          buffSkill: { Ha: true },
          buffSkillOrderValue: "Ha",
          buffSkillCondition: [["hp,2,0.5"]],
        }),
        snap({ hp: 0.9, skillReady: { 412: true } })
      )
    ).toEqual({ kind: "noop" });
  });

  it("buffSkill 未配置 -> noop", () => {
    expect(decideBuff({ buffSkillSwitch: true }, snap())).toEqual({ kind: "noop" });
  });

  it("enabled buff spell ready and missing -> click skill id", () => {
    expect(
      decideBuff(
        enabled({ buffSkill: { Ha: true }, buffSkillOrderValue: "Ha" }),
        snap({ skillReady: { 412: true } })
      )
    ).toEqual({ kind: "click", selector: "412" });
  });

  it("pre-cast Spirit gates before buff spell", () => {
    expect(
      decideBuff(
        enabled({
          buffSkill: { Ha: true },
          buffSkillOrderValue: "Ha",
          preCastSS: true,
          preCastSSCondition: [["sp,1,0.5"]],
        }),
        snap({ sp: 0.8, skillReady: { 412: true } })
      )
    ).toEqual({ kind: "toggle-spirit" });
  });

  it("enabled draught without active item buff -> click item selector", () => {
    expect(decideBuff(enabled({ buffSkill: { HD: true } }), snap())).toEqual({
      kind: "click",
      selector: '.bti3>div[onmouseover*="11191"]',
    });
  });
});
