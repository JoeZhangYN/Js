import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema heal gem fields", () => {
  it("exposes basic gem thresholds through the schema entry", () => {
    for (const [key, defaultValue] of [
      ["hp1", 50],
      ["mp1", 70],
      ["sp1", 75],
    ]) {
      expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key })).toMatchObject({
        key,
        kind: "number",
        default: defaultValue,
        group: "Heal",
      });
    }
  });
});
