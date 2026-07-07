import { describe, expect, it } from "vitest";
import { renderBattleTabSwitchSchemaField } from "./render.js";

describe("renderBattleTabSwitchSchemaField", () => {
  it("derives infusion tab switch from option schema", () => {
    const html = renderBattleTabSwitchSchemaField("infusionSwitch");

    expect(html).toContain('id="infusionSwitch"');
    expect(html).toContain('<label for="infusionSwitch">');
    expect(html).toContain("<l2>Infusion</l2>");
  });
});
