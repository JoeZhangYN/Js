import { describe, expect, it } from "vitest";
import { BattleScrollCoverageEvent, runBattleScrollCoverage } from "./scroll-coverage.js";

function isCovered(state, scrollSpec, options) {
  return runBattleScrollCoverage({
    type: BattleScrollCoverageEvent.READ_COVERAGE,
    state,
    scrollSpec,
    options,
  });
}

describe("runBattleScrollCoverage", () => {
  it("returns false when no scroll image is active", () => {
    expect(isCovered({ playerBuffs: [] }, { mult: 1, img1: "protection" })).toBe(false);
  });

  it("uses scroll buff containment instead of exact player buff activation", () => {
    expect(
      isCovered(
        { playerBuffs: ["protection_scroll"] },
        { mult: 1, img1: "protection" }
      )
    ).toBe(true);
  });

  it("requires the scroll suffix when scrollFirst is enabled", () => {
    expect(
      isCovered(
        { playerBuffs: ["protection"] },
        { mult: 1, img1: "protection" },
        { scrollFirst: true }
      )
    ).toBe(false);
    expect(
      isCovered(
        { playerBuffs: ["protection_scroll"] },
        { mult: 1, img1: "protection" },
        { scrollFirst: true }
      )
    ).toBe(true);
  });

  it("covers multi-effect scrolls when any required image is active", () => {
    expect(
      isCovered(
        { playerBuffs: ["shadowveil"] },
        { mult: 3, img1: "absorb", img2: "shadowveil", img3: "sparklife" }
      )
    ).toBe(true);
  });

  it("ignores missing image slots", () => {
    expect(isCovered({ playerBuffs: ["absorb"] }, { mult: 2 })).toBe(false);
  });

  it("rejects unknown scroll coverage events", () => {
    expect(runBattleScrollCoverage({ type: "unknown" })).toBe(false);
  });
});
