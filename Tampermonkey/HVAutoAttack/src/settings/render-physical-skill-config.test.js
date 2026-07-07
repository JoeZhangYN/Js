import { describe, expect, it } from "vitest";
import {
  renderPhysicalSkillActionCheckboxes,
  renderPhysicalSkillOrderCheckboxes,
} from "./render.js";

describe("renderPhysicalSkillActionCheckboxes", () => {
  it("derives physical skill action controls from the physical skill identity", () => {
    const html = renderPhysicalSkillActionCheckboxes({ afterKeyHtml: { T3: "<merciful />" } });

    expect(html).toContain('id="skill_OFC"');
    expect(html).toContain('id="skillOTOS_OFC"');
    expect(html).toContain("<l2>T3(if exist)</l2>");
    expect(html).toContain("<merciful />{{skillT3Condition}}");
    expect(html).toContain('id="skill_T1"');
    expect(html).not.toContain("skillOrder_");
  });

  it("keeps physical skill order labels separate from action labels", () => {
    const html = renderPhysicalSkillOrderCheckboxes();

    expect(html).toContain('id="skillOrder_T3"');
    expect(html).toContain("<l2>T3</l2>");
    expect(html).not.toContain("T3(if exist)");
    expect(html).not.toContain("skillOTOS_");
  });
});
