import { describe, expect, it } from "vitest";
import { renderOffensiveSpellAoeRows } from "./render.js";

describe("renderOffensiveSpellAoeRows", () => {
  it("derives offensive spell AoE controls from spell identity", () => {
    const html = renderOffensiveSpellAoeRows();

    expect(html).toContain(
      'Fire: T1:<input class="hvAANumber" name="spellAoe_11" placeholder="1" type="text">'
    );
    expect(html).toContain(
      'T3:<input class="hvAANumber" name="spellAoe_13" placeholder="1" type="text">'
    );
    expect(html).toContain(
      'Dark: T1:<input class="hvAANumber" name="spellAoe_61" placeholder="1" type="text">'
    );
    expect(html).toContain(
      'T3:<input class="hvAANumber" name="spellAoe_63" placeholder="1" type="text">'
    );
    expect(html).not.toContain("spellAoe_14");
    expect(html).not.toContain("Firebolt");
  });
});
