import { describe, expect, it } from "vitest";
import { BattleDebuffApplicabilityEvent, runBattleDebuffApplicability } from "./can-apply.js";

function verdict(over = {}) {
  return runBattleDebuffApplicability({
    type: BattleDebuffApplicabilityEvent.READ_VERDICT,
    monsterEffects: [],
    debuffKey: "We",
    opt: {},
    skillReady: true,
    ...over,
  });
}

describe("runBattleDebuffApplicability", () => {
  it("casts when the skill is ready and no active effect blocks recast", () => {
    expect(verdict()).toBe("cast");
  });

  it("skips while the debuff still has more than one turn", () => {
    expect(verdict({ monsterEffects: [{ img: "weaken", turns: 2 }] })).toBe("skip");
  });

  it("skips when the skill is not ready", () => {
    expect(verdict({ skillReady: false })).toBe("skip");
  });

  it("blocks when all debuff slots are occupied and last turn is under threshold", () => {
    expect(
      verdict({
        monsterEffects: Array.from({ length: 6 }, (_, i) => ({ img: `x${i}`, turns: i })),
        opt: { debuffSkillTurnAlert: true, debuffSkillTurn: { We: 9 } },
      })
    ).toBe("blocked");
  });

  it("rejects unknown events as skip", () => {
    expect(runBattleDebuffApplicability({ type: "unknown" })).toBe("skip");
  });
});
