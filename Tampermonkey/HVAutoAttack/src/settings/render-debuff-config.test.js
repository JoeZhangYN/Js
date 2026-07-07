import { describe, expect, it } from "vitest";
import { renderDebuffSkillCheckboxes, renderDebuffSkillNumberRows } from "./render.js";

describe("renderDebuffSkill configuration fields", () => {
  it("derives castable debuff enablement checkboxes from the shared debuff registry", () => {
    const html = renderDebuffSkillCheckboxes({ afterKeyHtml: { Dr: "<extra-drain />" } });

    expect(html).toContain('id="debuffSkill_Sle"');
    expect(html).toContain('for="debuffSkill_Im">Imperil</label>');
    expect(html).toContain("{{debuffSkillDrCondition}}</div><extra-drain />");
    expect(html).toContain('id="debuffSkill_Co"');
    expect(html).not.toContain("debuffSkill_CM");
    expect(html).not.toContain("debuffSkill_Stun");
  });

  it("derives castable debuff numeric fields without weapon-only debuffs", () => {
    const aoe = renderDebuffSkillNumberRows("debuffSkillAoe", { placeholder: "1" });
    const turns = renderDebuffSkillNumberRows("debuffSkillTurn");

    expect(aoe).toContain('Sleep: <input class="hvAANumber" name="debuffSkillAoe_Sle"');
    expect(aoe).toContain('placeholder="1"');
    expect(aoe).toContain('Confuse: <input class="hvAANumber" name="debuffSkillAoe_Co"');
    expect(aoe).not.toContain("debuffSkillAoe_CM");
    expect(turns).toContain('Imperil: <input class="hvAANumber" name="debuffSkillTurn_Im"');
    expect(turns).not.toContain("placeholder=");
  });
});
