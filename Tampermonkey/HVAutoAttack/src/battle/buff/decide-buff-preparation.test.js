import { describe, expect, it } from "vitest";
import { decideBuffPreparation } from "./decide-buff-preparation.js";

function event(over = {}) {
  return {
    opt: {},
    conditionFacts: {},
    attackStatus: 0,
    channeling: false,
    skillReady: {},
    playerBuffs: [],
    playerEffects: [],
    playerEffectTurns: {},
    ...over,
  };
}

describe("decideBuffPreparation", () => {
  it("uses infusion before channel and buff decisions", () => {
    expect(
      decideBuffPreparation(
        event({
          opt: {
            infusionSwitch: true,
            channelSkillSwitch: true,
            channelSkill: { Pr: true },
            buffSkillSwitch: true,
            buffSkill: { Pr: true },
            buffSkillOrderValue: "Pr",
          },
          attackStatus: 1,
          channeling: true,
          skillReady: { 411: true },
        })
      )
    ).toEqual({ kind: "item-command", itemId: 12101 });
  });

  it("uses channel before ordinary buff recast", () => {
    expect(
      decideBuffPreparation(
        event({
          opt: {
            channelSkillSwitch: true,
            channelSkill: { Pr: true },
            buffSkillSwitch: true,
            buffSkill: { Pr: true },
            buffSkillOrderValue: "Pr",
          },
          channeling: true,
          skillReady: { 411: true },
        })
      )
    ).toEqual({ kind: "channel-plan", plan: { type: "click", skillId: "411" } });
  });

  it("falls through to ordinary buff decisions", () => {
    expect(
      decideBuffPreparation(
        event({
          opt: {
            buffSkillSwitch: true,
            buffSkill: { Pr: true },
            buffSkillOrderValue: "Pr",
          },
          skillReady: { 411: true },
        })
      )
    ).toEqual({ kind: "skill-command", skillId: "411" });
  });
});
