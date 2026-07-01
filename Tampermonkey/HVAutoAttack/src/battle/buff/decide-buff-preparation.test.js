import { describe, expect, it } from "vitest";
import { BattleBuffPreparationEvent, runBattleBuffPreparation } from "./decide-buff-preparation.js";

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

function decide(snap, opt) {
  return runBattleBuffPreparation({
    type: BattleBuffPreparationEvent.DECIDE,
    snap,
    opt,
  });
}

describe("runBattleBuffPreparation", () => {
  it("uses infusion before channel and buff decisions", () => {
    expect(
      decide(
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
      decide(
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
      decide(
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

  it("rejects unknown buff preparation events as no action", () => {
    expect(runBattleBuffPreparation({ type: "unknown" })).toEqual({ kind: "noop" });
    expect(runBattleBuffPreparation(null)).toEqual({ kind: "noop" });
  });
});
