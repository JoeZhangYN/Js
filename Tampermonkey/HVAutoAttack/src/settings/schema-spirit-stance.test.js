import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema Spirit Stance fields", () => {
  it("exposes Spirit Stance options through the schema entry", () => {
    for (const key of ["turnOnSS", "turnOffSS", "preCastSS"]) {
      expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key })).toMatchObject({
        key,
        kind: "checkbox",
        default: false,
        group: "Tactics",
      });
    }
  });

  it("groups Spirit Stance options under Tactics", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Tactics" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(expect.arrayContaining(["turnOnSS", "turnOffSS", "preCastSS"]));
  });
});
