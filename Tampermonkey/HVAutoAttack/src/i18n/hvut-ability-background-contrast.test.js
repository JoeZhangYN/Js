import { describe, expect, it } from "vitest";
import {
  decideHvutAbilityPointContrast,
  HvutAbilityPointTone,
} from "./hvut-ability-background-contrast.js";

describe("HVUT ability point background contrast", () => {
  it.each([
    ["default", "rgb(237, 235, 223)", HvutAbilityPointTone.DARK, "#000"],
    ["major red", "rgb(204, 0, 0)", HvutAbilityPointTone.LIGHT, "#fff"],
    ["supportive green", "rgb(0, 153, 0)", HvutAbilityPointTone.DARK, "#000"],
    ["protection blue", "rgb(0, 51, 204)", HvutAbilityPointTone.LIGHT, "#fff"],
    ["drain purple", "rgb(204, 0, 204)", HvutAbilityPointTone.LIGHT, "#fff"],
  ])("chooses maximum contrast for %s", (_name, background, tone, textColor) => {
    expect(decideHvutAbilityPointContrast({ backgroundColors: [background] })).toMatchObject({
      kind: "accepted",
      tone,
      textColor,
      source: "computedLayers",
    });
  });

  it("composites transparent child layers over the actual ancestor background", () => {
    expect(
      decideHvutAbilityPointContrast({
        backgroundColors: ["rgba(255, 255, 255, 0.25)", "rgb(0, 51, 204)"],
      })
    ).toMatchObject({
      kind: "accepted",
      tone: HvutAbilityPointTone.LIGHT,
      textColor: "#fff",
      effectiveBackground: "rgb(64, 102, 217)",
    });
  });

  it("uses a dark fallback only when no computed color is readable", () => {
    expect(decideHvutAbilityPointContrast({ backgroundColors: ["not-a-color"] })).toMatchObject({
      kind: "accepted",
      tone: HvutAbilityPointTone.DARK,
      textColor: "#000",
      source: "defaultWhite",
    });
  });
});
