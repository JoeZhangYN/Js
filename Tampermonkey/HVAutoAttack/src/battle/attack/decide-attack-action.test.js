import { describe, expect, it } from "vitest";
import { decideAttackAction } from "./decide-attack-action.js";

describe("decideAttackAction", () => {
  it("accepts snap and options as the attack action entry", () => {
    expect(
      decideAttackAction(
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
});
