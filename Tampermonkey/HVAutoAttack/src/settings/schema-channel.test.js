import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema channel settings fields", () => {
  it("exposes channel skill switch through the schema entry", () => {
    expect(
      runOptionSchema({
        type: OptionSchemaEvent.READ_FIELD,
        key: "channelSkillSwitch",
      })
    ).toMatchObject({
      key: "channelSkillSwitch",
      kind: "checkbox",
      group: "Channel",
      default: false,
    });
  });

  it("groups channel settings under Channel", () => {
    const keys = runOptionSchema({
      type: OptionSchemaEvent.READ_GROUP,
      group: "Channel",
    }).map((field) => field.key);

    expect(keys).toEqual(expect.arrayContaining(["channelSkillSwitch"]));
  });
});
