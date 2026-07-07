import { describe, expect, it } from "vitest";
import { renderBuffSkillActionCheckboxes, renderBuffSkillCheckboxes } from "./render.js";

describe("renderBuffSkillActionCheckboxes", () => {
  it("derives buff enablement from draught and spell buff action identities", () => {
    const html = renderBuffSkillActionCheckboxes();

    expect(html).toContain('id="buffSkill_HD"');
    expect(html).toContain('for="buffSkill_BG">Bubble-Gum</label>');
    expect(html).toContain('id="buffSkill_Pr"');
    expect(html).toContain("{{buffSkillAbCondition}}");
    expect(html).not.toContain("buffSkillOrder_");
    expect(html).not.toContain("channelSkill_");
  });

  it("keeps spell-only buff order separate from draught enablement", () => {
    const html = renderBuffSkillCheckboxes("buffSkillOrder");

    expect(html).toContain('id="buffSkillOrder_Pr"');
    expect(html).toContain('id="buffSkillOrder_Ab"');
    expect(html).not.toContain("buffSkillOrder_HD");
    expect(html).not.toContain("buffSkillOrder_BG");
  });
});
