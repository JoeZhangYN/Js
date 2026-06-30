import { describe, expect, it } from "vitest";
import { shouldRecastPlayerBuff } from "./player-buff-recast.js";

describe("shouldRecastPlayerBuff", () => {
  it("missing buff image is not a recast request", () => {
    expect(shouldRecastPlayerBuff({}, undefined)).toBe(false);
    expect(shouldRecastPlayerBuff({}, "")).toBe(false);
  });

  it("missing active effect should be recast", () => {
    expect(shouldRecastPlayerBuff({ playerEffects: [] }, "haste")).toBe(true);
  });

  it("uses exact playerEffectTurns entries when present", () => {
    expect(shouldRecastPlayerBuff({ playerEffectTurns: { haste: 5 } }, "haste")).toBe(false);
    expect(shouldRecastPlayerBuff({ playerEffectTurns: { haste: 1 } }, "haste")).toBe(true);
  });

  it("keeps permanent effects from recasting", () => {
    expect(shouldRecastPlayerBuff({ playerEffectTurns: { haste: Infinity } }, "haste")).toBe(false);
  });

  it("falls back to exact playerEffects matches", () => {
    expect(
      shouldRecastPlayerBuff(
        { playerEffects: [{ img: "haste", name: "Hastened", turns: 5 }] },
        "haste"
      )
    ).toBe(false);
    expect(
      shouldRecastPlayerBuff(
        { playerEffects: [{ img: "haste", name: "Hastened", turns: 1 }] },
        "haste"
      )
    ).toBe(true);
  });

  it("does not treat substring image names as active effects", () => {
    expect(
      shouldRecastPlayerBuff(
        { playerEffects: [{ img: "regeneration", name: "Regeneration", turns: 9 }] },
        "regen"
      )
    ).toBe(true);
  });

  it("prefers playerEffectTurns over playerEffects for the same image", () => {
    expect(
      shouldRecastPlayerBuff(
        {
          playerEffectTurns: { haste: 5 },
          playerEffects: [{ img: "haste", name: "Hastened", turns: 1 }],
        },
        "haste"
      )
    ).toBe(false);
  });
});
