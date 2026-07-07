import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema usage tracking fields", () => {
  it("exposes usage tracking switch through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "recordUsage" })
    ).toMatchObject({
      key: "recordUsage",
      kind: "checkbox",
      default: false,
      group: "Usage",
    });
  });

  it("groups usage tracking settings under Usage", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Usage" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(expect.arrayContaining(["recordUsage"]));
  });
});
