import { describe, expect, it } from "vitest";
import { BattleAttackActionEvent, runBattleAttackAction } from "./decide-attack-action.js";

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

  it("rejects unknown events as no action", () => {
    expect(runBattleAttackAction({ type: "unknown" })).toEqual({ kind: "noop" });
  });
});
