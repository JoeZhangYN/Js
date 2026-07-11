import { describe, expect, it } from "vitest";
import {
  decideHvutAbilityRankRequirement,
  HvutAbilityRankAction,
  HvutAbilityRequirementLayout,
  HvutAbilityRankState,
} from "./hvut-ability-requirement.js";

describe("HVUT ability rank requirement decision", () => {
  it.each([
    ["f", 1, HvutAbilityRankState.ACQUIRED, HvutAbilityRankAction.NONE],
    ["u", 1, HvutAbilityRankState.UNLOCKABLE, HvutAbilityRankAction.UNLOCK],
    ["u", -1, HvutAbilityRankState.UNLOCKABLE, HvutAbilityRankAction.INSUFFICIENT_POINTS],
    ["x", 1, HvutAbilityRankState.LEVEL_LOCKED, HvutAbilityRankAction.NONE],
  ])("keeps point and level requirements for button state %s", (buttonType, remaining, state, action) => {
    expect(
      decideHvutAbilityRankRequirement({
        abilityPoints: 4,
        requiredPlayerLevel: 295,
        buttonType,
        remainingAbilityPoints: remaining,
      })
    ).toEqual({
      kind: "accepted",
      requirement: {
        abilityPoints: 4,
        playerLevel: 295,
        abilityPointsText: "4",
        playerLevelText: "(295)",
        layout: HvutAbilityRequirementLayout.POINTS_CENTER_LEVEL_BELOW,
      },
      rankState: state,
      action,
    });
  });

  it("preserves requirements while classifying an unknown button state", () => {
    expect(
      decideHvutAbilityRankRequirement({
        abilityPoints: 4,
        requiredPlayerLevel: 295,
        buttonType: "drifted",
      })
    ).toEqual({
      kind: "unknownState",
      reason: "unrecognizedButtonType",
      requirement: {
        abilityPoints: 4,
        playerLevel: 295,
        abilityPointsText: "4",
        playerLevelText: "(295)",
        layout: HvutAbilityRequirementLayout.POINTS_CENTER_LEVEL_BELOW,
      },
      rankState: HvutAbilityRankState.UNKNOWN,
      action: HvutAbilityRankAction.NONE,
    });
  });

  it("rejects missing catalog requirements instead of rendering empty text", () => {
    expect(
      decideHvutAbilityRankRequirement({ abilityPoints: undefined, requiredPlayerLevel: 295 })
    ).toEqual({ kind: "rejected", reason: "invalidRequirement" });
  });

  it("keeps points centered and formats the lower level with ASCII parentheses", () => {
    for (const buttonType of ["f", "u", "x", "drifted"]) {
      const outcome = decideHvutAbilityRankRequirement({
        abilityPoints: 3,
        requiredPlayerLevel: 200,
        buttonType,
        remainingAbilityPoints: 10,
      });
      expect(outcome.requirement).toMatchObject({
        abilityPointsText: "3",
        playerLevelText: "(200)",
        layout: "pointsCenterLevelBelow",
      });
      expect(outcome.requirement.playerLevelText).not.toMatch(/[（）]/);
    }
  });
});
