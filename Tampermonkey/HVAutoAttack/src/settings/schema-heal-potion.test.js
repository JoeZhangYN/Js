import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema heal potion fields", () => {
  it("exposes no-waste potion options through the schema entry", () => {
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "noWastePotion" })).toMatchObject(
      {
        key: "noWastePotion",
        kind: "checkbox",
        default: true,
        defaultOn: true,
        group: "Heal",
      }
    );
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "potionWasteTolerance" })
    ).toMatchObject({
      key: "potionWasteTolerance",
      kind: "number",
      default: 0.7,
      group: "Heal",
    });
  });
});
