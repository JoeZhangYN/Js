import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema heal stall fields", () => {
  it("exposes stall strategy options through the schema entry", () => {
    for (const key of ["stallMode", "stallFocus", "stallTurnOffSpirit"]) {
      expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key })).toMatchObject({
        key,
        kind: "checkbox",
        default: true,
        defaultOn: true,
        group: "Heal",
      });
    }
    for (const [key, defaultValue] of [
      ["stallFocusOcThreshold", 60],
      ["stallFocusMpMax", 80],
      ["stallTopupMpFloor", 70],
      ["stallTopupSpFloor", 70],
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
