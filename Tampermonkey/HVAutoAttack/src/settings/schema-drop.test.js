import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema drop monitor fields", () => {
  it("exposes drop monitor settings through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "dropMonitor" })
    ).toMatchObject({
      key: "dropMonitor",
      kind: "checkbox",
      default: false,
      group: "Drop",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "dropQuality" })
    ).toMatchObject({
      key: "dropQuality",
      kind: "select",
      default: 0,
      group: "Drop",
      enum: ["0", "1", "2", "3", "4", "5", "6", "7"],
      enumLabel: {
        0: "Crude",
        1: "Fair",
        2: "Average",
        3: "Superior",
        4: "Exquisite",
        5: "Magnificent",
        6: "Legendary",
        7: "Peerless",
      },
    });
  });

  it("groups drop monitor settings under Drop", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Drop" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(expect.arrayContaining(["dropMonitor", "dropQuality"]));
  });
});
