import { describe, expect, it } from "vitest";

import { renderRepairThresholdSchemaField } from "./render.js";

describe("renderRepairThresholdSchemaField", () => {
  it("derives the repair enablement and threshold controls from schema", () => {
    const html = renderRepairThresholdSchemaField();

    expect(html).toContain('id="repair" type="checkbox"');
    expect(html).toContain('for="repair"');
    expect(html).toContain('name="repairValue" placeholder="60" type="text">%');
    expect(html).toContain("≤");
    expect(html).not.toContain('name="repairValue" placeholder="60"</div>');
  });
});
