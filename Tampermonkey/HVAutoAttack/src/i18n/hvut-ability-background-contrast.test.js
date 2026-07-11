import { describe, expect, it } from "vitest";
import {
  decideHvutAbilityPointContrast,
  HvutAbilityPointTone,
} from "./hvut-ability-background-contrast.js";

describe("HVUT ability point background contrast", () => {
  it.each([
    ["url(/isekai/y/ab/5bf.png)", "blue", HvutAbilityPointTone.LIGHT, "#fff"],
    ['url("/isekai/y/ab/7gf.png")', "green", HvutAbilityPointTone.DARK, "#000"],
    ["url(/isekai/y/ab/2rf.png)", "red", HvutAbilityPointTone.LIGHT, "#fff"],
    ["url(/isekai/y/ab/1pf.png)", "purple", HvutAbilityPointTone.LIGHT, "#fff"],
  ])("classifies the real ability asset %s", (backgroundImage, family, tone, textColor) => {
    expect(decideHvutAbilityPointContrast({ backgroundImage })).toMatchObject({
      kind: "accepted",
      source: "abilityAssetOpaque",
      backgroundFamily: family,
      tone,
      textColor,
    });
  });

  it.each([
    ["url(/isekai/y/ab/5bu.png)", "blue"],
    ["url(/isekai/y/ab/7gu.png)", "green"],
    ["url(/isekai/y/ab/2ru.png)", "red"],
    ["url(/isekai/y/ab/1pu.png)", "purple"],
  ])("uses the real parent background under transparent unlock asset %s", (backgroundImage, family) => {
    expect(
      decideHvutAbilityPointContrast({
        backgroundImage,
        backgroundColors: ["rgba(0, 0, 0, 0)", "rgb(255, 255, 255)"],
      })
    ).toMatchObject({
      kind: "accepted",
      source: "abilityAssetTransparent",
      backgroundFamily: family,
      tone: HvutAbilityPointTone.DARK,
      textColor: "#000",
      effectiveBackground: "rgb(255, 255, 255)",
    });
  });

  it("uses the parent background under the colorless locked asset", () => {
    expect(
      decideHvutAbilityPointContrast({
        backgroundImage: "url(/isekai/y/ab/2x.png)",
        backgroundColors: ["transparent", "rgb(237, 235, 223)"],
      })
    ).toMatchObject({
      source: "abilityAssetTransparent",
      backgroundFamily: "default",
      tone: HvutAbilityPointTone.DARK,
      textColor: "#000",
    });
  });

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
      backgroundFamily: "unclassified",
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
