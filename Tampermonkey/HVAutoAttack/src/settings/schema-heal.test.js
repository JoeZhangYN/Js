import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema heal fields", () => {
  it("exposes dynamic heal threshold options through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "dynamicHealThreshold" })
    ).toMatchObject({
      key: "dynamicHealThreshold",
      kind: "checkbox",
      default: false,
      group: "Heal",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "playerMaxHp" })
    ).toMatchObject({
      key: "playerMaxHp",
      kind: "number",
      default: 17000,
      group: "Heal",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "dynamicHealSafetyPad" })
    ).toMatchObject({
      key: "dynamicHealSafetyPad",
      kind: "number",
      default: 1.3,
      group: "Heal",
    });
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "autoTune" })).toMatchObject({
      key: "autoTune",
      kind: "checkbox",
      default: false,
      group: "Heal",
    });
  });
});
