import { describe, expect, it } from "vitest";
import {
  SettingsOrderControlEvent,
  runSettingsOrderControlCatalog,
} from "./order-control-catalog.js";

describe("settings order control catalog", () => {
  it("exposes support buff order controls without draught actions", () => {
    const skills = runSettingsOrderControlCatalog({
      type: SettingsOrderControlEvent.READ_SUPPORT_BUFF_SKILLS,
    });

    expect(skills.map(({ key }) => key)).toContain("Pr");
    expect(skills.map(({ key }) => key)).toContain("Ab");
    expect(skills.map(({ key }) => key)).not.toContain("HD");
  });

  it("exposes castable debuff controls without weapon-only effects", () => {
    const skills = runSettingsOrderControlCatalog({
      type: SettingsOrderControlEvent.READ_CASTABLE_DEBUFF_SKILLS,
    });

    expect(skills.map(({ key }) => key)).toContain("Sle");
    expect(skills.map(({ key }) => key)).toContain("Im");
    expect(skills.map(({ key }) => key)).not.toContain("CM");
  });

  it("keeps item and physical order identities readable through one entry", () => {
    const items = runSettingsOrderControlCatalog({
      type: SettingsOrderControlEvent.READ_ITEM_ORDER,
    });
    const skills = runSettingsOrderControlCatalog({
      type: SettingsOrderControlEvent.READ_PHYSICAL_SKILL_ORDER,
    });

    expect(items).toContainEqual(expect.objectContaining({ key: "Cure", itemId: "311" }));
    expect(skills).toContainEqual(expect.objectContaining({ key: "OFC" }));
    expect(runSettingsOrderControlCatalog(null)).toBeUndefined();
  });

  it("exposes battle support controls without leaking direct render ownership", () => {
    const buffActions = runSettingsOrderControlCatalog({
      type: SettingsOrderControlEvent.READ_BUFF_ACTIONS,
    });
    const allDebuffs = runSettingsOrderControlCatalog({
      type: SettingsOrderControlEvent.READ_ALL_DEBUFF_ACTIONS,
    });

    expect(buffActions).toContainEqual(expect.objectContaining({ key: "HD" }));
    expect(buffActions).toContainEqual(expect.objectContaining({ key: "Pr" }));
    expect(allDebuffs).toEqual([
      { key: "debuffSkillAllIm", conditionKey: "debuffSkillImpCondition" },
      { key: "debuffSkillAllWk", conditionKey: "debuffSkillWkCondition" },
    ]);
  });

  it("exposes arena, round, scroll, and spell control surfaces", () => {
    const spellRows = runSettingsOrderControlCatalog({
      type: SettingsOrderControlEvent.READ_OFFENSIVE_SPELL_AOE_ROWS,
    });
    const arenaLevels = runSettingsOrderControlCatalog({
      type: SettingsOrderControlEvent.READ_IDLE_ARENA_LEVELS,
    });
    const roundTypes = runSettingsOrderControlCatalog({
      type: SettingsOrderControlEvent.READ_BATTLE_ROUND_TYPES,
    });
    const scrolls = runSettingsOrderControlCatalog({
      type: SettingsOrderControlEvent.READ_BATTLE_SCROLLS,
    });

    expect(spellRows).toContainEqual(expect.objectContaining({ code: "1", label: "Fire" }));
    expect(spellRows.at(-1)).toMatchObject({ label: "Dark", last: true });
    expect(arenaLevels).toContainEqual(expect.objectContaining({ key: "GF", value: "gr" }));
    expect(roundTypes).toContainEqual({ code: "ba", label: "Encounter" });
    expect(scrolls).toContainEqual(
      expect.objectContaining({ key: "Go", label: "Scroll of the Gods" })
    );
  });
});
