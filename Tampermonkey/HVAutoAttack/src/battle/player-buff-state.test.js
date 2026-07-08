import { describe, expect, it } from "vitest";
import { BattlePlayerBuffStateEvent, runBattlePlayerBuffState } from "./player-buff-state.js";

function readActive(state, img) {
  return runBattlePlayerBuffState({
    type: BattlePlayerBuffStateEvent.READ_ACTIVE,
    state,
    img,
  });
}

function shouldRecast(state, img) {
  return runBattlePlayerBuffState({
    type: BattlePlayerBuffStateEvent.SHOULD_RECAST,
    state,
    img,
  });
}

describe("runBattlePlayerBuffState READ_ACTIVE", () => {
  it("missing buff image is not active", () => {
    expect(readActive({}, undefined)).toBe(false);
    expect(readActive({}, "")).toBe(false);
  });

  it("checks exact playerBuffs entries", () => {
    expect(readActive({ playerBuffs: ["haste"] }, "haste")).toBe(true);
    expect(readActive({ playerBuffs: ["hastened"] }, "haste")).toBe(false);
  });
});

describe("runBattlePlayerBuffState SHOULD_RECAST", () => {
  it("missing buff image is not a recast request", () => {
    expect(shouldRecast({}, undefined)).toBe(false);
    expect(shouldRecast({}, "")).toBe(false);
  });

  it("missing active effect should be recast", () => {
    expect(shouldRecast({ playerEffects: [] }, "haste")).toBe(true);
  });

  it("uses exact playerEffectTurns entries when present", () => {
    expect(shouldRecast({ playerEffectTurns: { haste: 5 } }, "haste")).toBe(false);
    expect(shouldRecast({ playerEffectTurns: { haste: 1 } }, "haste")).toBe(true);
  });

  it("keeps permanent effects from recasting", () => {
    expect(shouldRecast({ playerEffectTurns: { haste: Infinity } }, "haste")).toBe(false);
  });

  it("falls back to exact playerEffects matches", () => {
    expect(
      shouldRecast({ playerEffects: [{ img: "haste", name: "Hastened", turns: 5 }] }, "haste")
    ).toBe(false);
    expect(
      shouldRecast({ playerEffects: [{ img: "haste", name: "Hastened", turns: 1 }] }, "haste")
    ).toBe(true);
  });

  it("does not treat substring image names as active effects", () => {
    expect(
      shouldRecast(
        { playerEffects: [{ img: "regeneration", name: "Regeneration", turns: 9 }] },
        "regen"
      )
    ).toBe(true);
  });

  it("prefers playerEffectTurns over playerEffects for the same image", () => {
    expect(
      shouldRecast(
        {
          playerEffectTurns: { haste: 5 },
          playerEffects: [{ img: "haste", name: "Hastened", turns: 1 }],
        },
        "haste"
      )
    ).toBe(false);
  });

  it("rejects unknown player buff state events", () => {
    expect(runBattlePlayerBuffState({ type: "unknown" })).toBe(false);
    expect(runBattlePlayerBuffState(null)).toBe(false);
  });
});
