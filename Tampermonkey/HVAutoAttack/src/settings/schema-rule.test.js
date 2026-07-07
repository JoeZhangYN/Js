import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

const TARGET_WEIGHT_DEFAULTS = Object.freeze({
  weight_Sle: 5,
  weight_Bl: 3,
  weight_Slo: 3,
  weight_Im: -5,
  weight_MN: -4,
  weight_Si: -4,
  weight_Dr: -4,
  weight_We: -4,
  weight_Co: -1,
  weight_CM: -5,
  weight_Stun: -4,
  weight_PA: -4,
  weight_BW: -4,
});

describe("runOptionSchema attack rule fields", () => {
  it("exposes target weight defaults through the schema entry", () => {
    for (const [key, defaultValue] of Object.entries(TARGET_WEIGHT_DEFAULTS)) {
      expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key })).toMatchObject({
        key,
        kind: "number",
        default: defaultValue,
        group: "Rule",
      });
    }
  });

  it("exposes reverse target weight selection through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "ruleReverse" })
    ).toMatchObject({
      key: "ruleReverse",
      kind: "checkbox",
      default: false,
      group: "Rule",
    });
  });

  it("groups target weight settings under Rule", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Rule" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(
      expect.arrayContaining([...Object.keys(TARGET_WEIGHT_DEFAULTS), "ruleReverse"])
    );
  });
});
