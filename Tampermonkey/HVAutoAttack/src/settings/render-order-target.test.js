import { describe, expect, it } from "vitest";
import {
  hasSettingsInputClass,
  readCustomizeHoverTarget,
  readSelectableReportTableTarget,
  readSingleOrderItemName,
  renderBattleRoundTypeCheckboxes,
  renderBattleRoundTypeSelectOptions,
  renderIdleArenaLevelCheckboxes,
  renderItemOrderCheckboxes,
  renderBuffSkillCheckboxes,
  renderChannelFallbackOrderCheckboxes,
  renderDebuffSkillOrderCheckboxes,
  renderPhysicalSkillOrderCheckboxes,
  shouldHydrateSettingsInput,
} from "./render.js";

describe("readSingleOrderItemName", () => {
  it("reads the order item suffix from checkbox ids", () => {
    expect(readSingleOrderItemName({ id: "skill_Fireball" })).toBe("Fireball");
  });

  it("fails closed for malformed order event targets", () => {
    expect(readSingleOrderItemName({ id: "skill" })).toBeNull();
    expect(readSingleOrderItemName({})).toBeNull();
    expect(readSingleOrderItemName(null)).toBeNull();
  });
});

describe("settings input class classification", () => {
  it("classifies settings hydration classes by token", () => {
    expect(shouldHydrateSettingsInput({ className: "hvAADebug hvAANumber" })).toBe(false);
    expect(shouldHydrateSettingsInput({ className: "hvAANumber extra" })).toBe(true);
    expect(hasSettingsInputClass("hvAACustomize active", "hvAACustomize")).toBe(true);
  });

  it("reads customize hover targets without assuming parent depth", () => {
    const root = { className: "customize active", parentNode: null };
    const child = { className: "customizeGroup", parentNode: root };
    const leaf = { className: "", parentNode: child };

    expect(readCustomizeHoverTarget(root)).toBe(root);
    expect(readCustomizeHoverTarget(leaf)).toBe(root);
    expect(readCustomizeHoverTarget({ className: "", parentNode: null })).toBeNull();
    expect(readCustomizeHoverTarget(null)).toBeNull();
  });

  it("reads selectable report tables without assuming parent depth", () => {
    const table = { tagName: "TABLE", parentNode: null };
    const tbody = { tagName: "TBODY", parentNode: table };
    const row = { tagName: "TR", parentNode: tbody };
    const cell = { tagName: "TD", parentNode: row };
    const icon = { tagName: "SPAN", parentNode: cell };

    expect(readSelectableReportTableTarget(icon)).toBe(table);
    expect(readSelectableReportTableTarget(cell)).toBe(table);
    expect(readSelectableReportTableTarget({ tagName: "DIV", parentNode: null })).toBeNull();
    expect(readSelectableReportTableTarget(null)).toBeNull();
  });
});

describe("renderBuffSkillCheckboxes", () => {
  it("derives support buff skill checkboxes from the shared buff registry", () => {
    const html = renderBuffSkillCheckboxes("channelSkill");

    expect(html).toContain('id="channelSkill_Pr"');
    expect(html).toContain('for="channelSkill_SL">Spark of Life</label>');
    expect(html).toContain('id="channelSkill_Ab"');
    expect(html).not.toContain("buffSkillOrder_");
  });
});

describe("renderChannelFallbackOrderCheckboxes", () => {
  it("derives Channel fallback order from heal and support buff action identities", () => {
    const html = renderChannelFallbackOrderCheckboxes();

    expect(html).toContain('id="channelSkill2Order_Cu" value="Cu,311"');
    expect(html).toContain('id="channelSkill2Order_FC" value="FC,313"');
    expect(html).toContain('id="channelSkill2Order_Pr" value="Pr,411"');
    expect(html).toContain('for="channelSkill2Order_Ab">Absorb</label>');
  });
});

describe("renderDebuffSkillOrderCheckboxes", () => {
  it("derives castable debuff order checkboxes from the shared debuff registry", () => {
    const html = renderDebuffSkillOrderCheckboxes();

    expect(html).toContain('id="debuffSkillOrder_Sle"');
    expect(html).toContain('for="debuffSkillOrder_Im">Imperil</label>');
    expect(html).toContain('id="debuffSkillOrder_Co"');
    expect(html).not.toContain("debuffSkillOrder_CM");
  });
});

describe("renderPhysicalSkillOrderCheckboxes", () => {
  it("derives physical skill order checkboxes from the physical order identity", () => {
    const html = renderPhysicalSkillOrderCheckboxes();

    expect(html).toContain('id="skillOrder_OFC"');
    expect(html).toContain("<l2>FRD</l2>");
    expect(html).toContain('id="skillOrder_T1"');
    expect(html).not.toContain("debuffSkillOrder_");
  });
});

describe("renderItemOrderCheckboxes", () => {
  it("derives item order checkboxes from the item order identity", () => {
    const html = renderItemOrderCheckboxes();

    expect(html).toContain('id="itemOrder_Cure" value="Cure,311"');
    expect(html).toContain('id="itemOrder_HP" value="HP,11195"');
    expect(html).toContain('id="itemOrder_ED" value="ED,11401"');
    expect(html).not.toContain("channelSkill2Order_");
  });
});

describe("renderIdleArenaLevelCheckboxes", () => {
  it("derives idle arena level checkboxes from the arena level identity", () => {
    const html = renderIdleArenaLevelCheckboxes('<input name="idleArenaGrTime">');

    expect(html).toContain('id="arLevel_1" value="1,1"');
    expect(html).toContain('id="arLevel_500" value="500,35"');
    expect(html).toContain('id="arLevel_RB250" value="RB250,112"');
    expect(html).toContain('id="arLevel_GF" value="GF,gr"');
    expect(html).toContain('name="idleArenaGrTime"');
  });
});

describe("renderBattleRoundType controls", () => {
  it("derives scroll round type checkboxes from the battle round type identity", () => {
    const html = renderBattleRoundTypeCheckboxes("scrollRoundType");

    expect(html).toContain('id="scrollRoundType_ar"');
    expect(html).toContain('for="scrollRoundType_rb">Ring of Blood</label>');
    expect(html).toContain('id="scrollRoundType_tw"');
    expect(html).not.toContain("arLevel_");
  });

  it("derives debug round type select options from the same battle round type identity", () => {
    const html = renderBattleRoundTypeSelectOptions({ includeBlank: true });

    expect(html.startsWith("<option></option>")).toBe(true);
    expect(html).toContain('<option value="ar">The Arena</option>');
    expect(html).toContain('<option value="ba">Encounter</option>');
    expect(html).toContain('<option value="tw">The Tower</option>');
  });
});
