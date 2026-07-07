import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema spell strategy fields", () => {
  it("exposes spell tier strategy options through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "channelForceHighTier" })
    ).toMatchObject({
      key: "channelForceHighTier",
      kind: "checkbox",
      default: true,
      defaultOn: true,
      group: "Spell",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "spellTierDowngrade" })
    ).toMatchObject({
      key: "spellTierDowngrade",
      kind: "checkbox",
      default: true,
      defaultOn: true,
      group: "Spell",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "spellDowngradeThreshold" })
    ).toMatchObject({
      key: "spellDowngradeThreshold",
      kind: "number",
      default: 3,
      group: "Spell",
    });
  });

  it("groups spell tier strategy options under Spell", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Spell" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(
      expect.arrayContaining([
        "autoElement",
        "channelForceHighTier",
        "spellTierDowngrade",
        "spellDowngradeThreshold",
      ])
    );
  });
});
