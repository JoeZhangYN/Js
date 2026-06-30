import { describe, expect, it } from "vitest";
import { decideBuffPreparation } from "./decide-buff-preparation.js";

function snap(over = {}) {
  return {
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
        snap({
          attackStatus: 1,
          channeling: true,
          skillReady: { 411: true },
        }),
        {
          infusionSwitch: true,
          channelSkillSwitch: true,
          channelSkill: { Pr: true },
          buffSkillSwitch: true,
          buffSkill: { Pr: true },
          buffSkillOrderValue: "Pr",
        }
      )
    ).toEqual({ kind: "item-command", itemId: 12101 });
  });

  it("uses channel before ordinary buff recast", () => {
    expect(
      decideBuffPreparation(
        snap({
          channeling: true,
          skillReady: { 411: true },
        }),
        {
          channelSkillSwitch: true,
          channelSkill: { Pr: true },
          buffSkillSwitch: true,
          buffSkill: { Pr: true },
          buffSkillOrderValue: "Pr",
        }
      )
    ).toEqual({ kind: "channel-plan", plan: { type: "click", skillId: "411" } });
  });

  it("falls through to ordinary buff decisions", () => {
    expect(
      decideBuffPreparation(
        snap({
          skillReady: { 411: true },
        }),
        {
          buffSkillSwitch: true,
          buffSkill: { Pr: true },
          buffSkillOrderValue: "Pr",
        }
      )
    ).toEqual({ kind: "skill-command", skillId: "411" });
  });
});
