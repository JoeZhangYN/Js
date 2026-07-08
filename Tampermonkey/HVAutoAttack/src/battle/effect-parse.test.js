import { describe, expect, it } from "vitest";
import { BattleEffectParseEvent, runBattleEffectParse } from "./effect-parse.js";

function effect(over = {}) {
  return {
    getAttribute: (name) => (name === "onmouseover" ? over.onmouseover : undefined),
  };
}

describe("runBattleEffectParse", () => {
  it("parses effect names and numeric remaining turns", () => {
    expect(
      runBattleEffectParse({
        type: BattleEffectParseEvent.READ_EFFECT,
        img: effect({ onmouseover: "battle.set_infopane_effect(this, 'Sleep', 3)" }),
      })
    ).toEqual({ name: "Sleep", turns: 3 });
  });

  it("treats permanent text turn values as Infinity", () => {
    expect(
      runBattleEffectParse({
        type: BattleEffectParseEvent.READ_EFFECT,
        img: effect({ onmouseover: "battle.set_infopane_effect(this, 'Haste', 'autocast')" }),
      })
    ).toEqual({ name: "Haste", turns: Infinity });
  });

  it("falls back for missing or malformed metadata", () => {
    expect(
      runBattleEffectParse({ type: BattleEffectParseEvent.READ_EFFECT, img: effect() })
    ).toEqual({ name: "", turns: Infinity });
  });

  it("rejects unknown effect parse events", () => {
    expect(runBattleEffectParse({ type: "unknown", img: effect() })).toBeUndefined();
    expect(runBattleEffectParse(null)).toBeUndefined();
  });
});
