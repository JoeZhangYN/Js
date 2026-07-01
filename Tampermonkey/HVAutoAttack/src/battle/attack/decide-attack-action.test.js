import { describe, expect, it } from "vitest";
import { BattleAttackActionEvent, runBattleAttackAction } from "./decide-attack-action.js";
import { runBattleAttackFacts } from "./attack-facts.js";

function decide(snap, opt) {
  return runBattleAttackAction({
    type: BattleAttackActionEvent.DECIDE,
    snap,
    opt,
  });
}

describe("runBattleAttackAction", () => {
  it("accepts snap and options as the attack action entry", () => {
    expect(
      decide(
        {
          view: [{ id: 7, order: 0, isDead: false, hpAbsNow: 1, hpMax: 1, buffs: [] }],
          playerBuffs: [],
          playerEffects: [],
          skillReady: {},
        },
        {}
      )
    ).toEqual({ kind: "attack-plan", plan: { type: "default", targetId: 7 } });
  });

  it("answers whether attack will clear with a big skill through the same entry", () => {
    expect(
      runBattleAttackAction({
        type: BattleAttackActionEvent.WILL_CLEAR_WITH_BIG_SKILL,
        snap: {
          aliveCount: 5,
          spiritOn: true,
          fightingStyle: "2",
          oc: 250,
          view: [{ id: 7, order: 0, isDead: false, hpAbsNow: 1, hpMax: 1, buffs: [] }],
          playerBuffs: [],
          playerEffects: [],
          skillReady: { 1111: true },
        },
        opt: { skillSwitch: true, skill_OFC: true },
      })
    ).toBe(true);
  });

  it("rejects unknown attack action events as no action", () => {
    expect(runBattleAttackAction({ type: "unknown" })).toEqual({ kind: "noop" });
    expect(runBattleAttackAction(null)).toEqual({ kind: "noop" });
  });

  it("rejects unknown attack facts events as empty facts", () => {
    expect(runBattleAttackFacts({ type: "unknown" })).toEqual({});
    expect(runBattleAttackFacts(null)).toEqual({});
  });
});
