import { describe, expect, it } from "vitest";
import { BattleSurvivalActionEvent, runBattleSurvivalAction } from "./decide-survival-action.js";

function snap(over = {}) {
  return {
    hp: 100,
    mp: 100,
    sp: 100,
    hpDeficit: 0,
    mpDeficit: 0,
    spDeficit: 0,
    gemName: null,
    roundType: "arena",
    playerBuffs: [],
    playerEffects: [],
    view: [],
    ...over,
  };
}

function decide(snap, opt) {
  return runBattleSurvivalAction({
    type: BattleSurvivalActionEvent.DECIDE,
    snap,
    opt,
  });
}

describe("runBattleSurvivalAction", () => {
  it("uses flee before later item and defend decisions", () => {
    expect(
      decide(snap({ gemName: "Mystic Gem" }), {
        autoFlee: true,
        defend: true,
      })
    ).toEqual({ kind: "flee-command" });
  });

  it("falls through empty potion and stall plans to defend", () => {
    expect(decide(snap(), { defend: true })).toEqual({ kind: "defend-command" });
  });

  it("uses scroll after earlier survival checks are empty", () => {
    expect(
      decide(snap({ playerBuffs: [] }), {
        scrollSwitch: true,
        scroll: { Pr: true },
        scrollRoundType: { arena: true },
      })
    ).toEqual({ kind: "item-plan", plan: { type: "scroll", candidates: [13111] } });
  });

  it("rejects unknown events as no action", () => {
    expect(runBattleSurvivalAction({ type: "unknown" })).toEqual({ kind: "noop" });
  });
});
