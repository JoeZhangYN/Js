import { describe, expect, it } from "vitest";

import { renderScrollFirstSchemaField } from "./render.js";

describe("renderScrollFirstSchemaField", () => {
  it("derives the scroll-first coverage option from schema", () => {
    const html = renderScrollFirstSchemaField();

    expect(html).toContain('id="scrollFirst" type="checkbox"');
    expect(html).toContain('for="scrollFirst"');
    expect(html).toContain("<l2>Use Scrolls even when matching spell buffs exist</l2>");
    expect(html).not.toContain("effects from spells");
  });
});
