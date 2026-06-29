import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema attack resource fields", () => {
  it("exposes attack resource action options through the schema entry", () => {
    for (const key of ["focus", "etherTap"]) {
      expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key })).toMatchObject({
        key,
        kind: "checkbox",
        default: false,
        group: "Tactics",
      });
    }
  });

  it("groups attack resource action options under Tactics", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Tactics" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(expect.arrayContaining(["focus", "etherTap"]));
  });
});
