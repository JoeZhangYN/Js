import { describe, expect, it } from "vitest";
import { isScrollCoveredByPlayerBuffs } from "./scroll-coverage.js";

describe("isScrollCoveredByPlayerBuffs", () => {
  it("returns false when no scroll image is active", () => {
    expect(isScrollCoveredByPlayerBuffs({ playerBuffs: [] }, { mult: 1, img1: "protection" })).toBe(
      false
    );
  });

  it("uses scroll buff containment instead of exact player buff activation", () => {
    expect(
      isScrollCoveredByPlayerBuffs(
        { playerBuffs: ["protection_scroll"] },
        { mult: 1, img1: "protection" }
      )
    ).toBe(true);
  });

  it("requires the scroll suffix when scrollFirst is enabled", () => {
    expect(
      isScrollCoveredByPlayerBuffs(
        { playerBuffs: ["protection"] },
        { mult: 1, img1: "protection" },
        { scrollFirst: true }
      )
    ).toBe(false);
    expect(
      isScrollCoveredByPlayerBuffs(
        { playerBuffs: ["protection_scroll"] },
        { mult: 1, img1: "protection" },
        { scrollFirst: true }
      )
    ).toBe(true);
  });

  it("covers multi-effect scrolls when any required image is active", () => {
    expect(
      isScrollCoveredByPlayerBuffs(
        { playerBuffs: ["shadowveil"] },
        { mult: 3, img1: "absorb", img2: "shadowveil", img3: "sparklife" }
      )
    ).toBe(true);
  });

  it("ignores missing image slots", () => {
    expect(isScrollCoveredByPlayerBuffs({ playerBuffs: ["absorb"] }, { mult: 2 })).toBe(false);
  });
});
