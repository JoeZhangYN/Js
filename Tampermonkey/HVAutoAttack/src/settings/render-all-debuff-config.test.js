import { describe, expect, it } from "vitest";
import { renderAllDebuffActionCheckboxes } from "./render.js";

describe("renderAllDebuffActionCheckboxes", () => {
  it("derives all-debuff action controls from schema and action identity", () => {
    const html = renderAllDebuffActionCheckboxes();

    expect(html).toContain('id="debuffSkillAllIm"');
    expect(html).toContain('<label for="debuffSkillAllIm">');
    expect(html).toContain("{{debuffSkillImpCondition}}");
    expect(html).toContain('id="debuffSkillAllWk"');
    expect(html).toContain("{{debuffSkillWkCondition}}");
    expect(html).not.toContain("Imperiled all enemies.");
    expect(html).not.toContain("Weakened all enemies.");
  });
});
