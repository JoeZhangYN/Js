import { describe, expect, it } from "vitest";
import { readSettingsTabClickName, renderBattleTabSwitchSchemaField } from "./render.js";

describe("renderBattleTabSwitchSchemaField", () => {
  it("derives infusion tab switch from option schema", () => {
    const html = renderBattleTabSwitchSchemaField("infusionSwitch");

    expect(html).toContain('id="infusionSwitch"');
    expect(html).toContain('<label for="infusionSwitch">');
    expect(html).toContain("<l2>Infusion</l2>");
  });
});

describe("readSettingsTabClickName", () => {
  it("keeps checkbox clicks as checkbox intent", () => {
    document.body.innerHTML =
      '<div class="hvAATabmenu"><span name="Buff"><input id="buffSkillSwitch" type="checkbox"></span></div>';

    expect(readSettingsTabClickName(document.querySelector("input"))).toBe(null);
  });

  it("reads tab intent from translated label text inside checkbox tabs", () => {
    document.body.innerHTML =
      '<div class="hvAATabmenu"><span name="Buff"><label for="buffSkillSwitch"><l0>增益</l0></label></span></div>';

    expect(readSettingsTabClickName(document.querySelector("l0"))).toBe("Buff");
  });
});
