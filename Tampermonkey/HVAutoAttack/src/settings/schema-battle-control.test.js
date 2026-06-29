import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema battle control fields", () => {
  it("exposes battle-control options through the schema entry", () => {
    for (const key of ["defend", "autoFlee", "autoPause"]) {
      expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key })).toMatchObject({
        key,
        kind: "checkbox",
        default: false,
        group: "Tactics",
      });
    }
  });

  it("groups battle-control options under Tactics", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Tactics" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(expect.arrayContaining(["defend", "autoFlee", "autoPause"]));
  });
});
