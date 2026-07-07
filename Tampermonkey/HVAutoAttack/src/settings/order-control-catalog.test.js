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
    const items = runSettingsOrderControlCatalog({ type: SettingsOrderControlEvent.READ_ITEM_ORDER });
    const skills = runSettingsOrderControlCatalog({
      type: SettingsOrderControlEvent.READ_PHYSICAL_SKILL_ORDER,
    });

    expect(items).toContainEqual(expect.objectContaining({ key: "Cure", itemId: "311" }));
    expect(skills).toContainEqual(expect.objectContaining({ key: "OFC" }));
    expect(runSettingsOrderControlCatalog(null)).toBeUndefined();
  });
});
