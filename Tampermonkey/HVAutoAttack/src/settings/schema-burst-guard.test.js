import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema burst guard fields", () => {
  it("exposes incoming-burst guard options through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "burstControlSwitch" })
    ).toMatchObject({
      key: "burstControlSwitch",
      kind: "checkbox",
      default: false,
      group: "Debuff",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "burstControlHpFrac" })
    ).toMatchObject({
      key: "burstControlHpFrac",
      kind: "number",
      default: 50,
      group: "Debuff",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "burstControlSilenceForSpell" })
    ).toMatchObject({
      key: "burstControlSilenceForSpell",
      kind: "checkbox",
      default: true,
      defaultOn: true,
      group: "Debuff",
    });
  });
});
