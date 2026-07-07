import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema main control fields", () => {
  it("exposes pause controls through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "pauseButton" })
    ).toMatchObject({
      key: "pauseButton",
      kind: "checkbox",
      default: false,
      group: "Main",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "pauseHotkey" })
    ).toMatchObject({
      key: "pauseHotkey",
      kind: "checkbox",
      default: false,
      group: "Main",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "pauseHotkeyStr" })
    ).toMatchObject({
      key: "pauseHotkeyStr",
      kind: "text",
      default: "",
      group: "Main",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "pauseHotkeyKey" })
    ).toMatchObject({
      key: "pauseHotkeyKey",
      kind: "text",
      default: "",
      group: "Main",
    });
  });

  it("exposes warning and built-in plugin toggles through the schema entry", () => {
    for (const key of ["alert", "notification", "riddleRadio", "encounter"]) {
      expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key })).toMatchObject({
        key,
        kind: "checkbox",
        default: false,
        group: "Main",
      });
    }
  });

  it("groups main controls under Main", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Main" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(
      expect.arrayContaining([
        "pauseButton",
        "pauseHotkey",
        "pauseHotkeyStr",
        "pauseHotkeyKey",
        "alert",
        "notification",
        "riddleRadio",
        "encounter",
      ])
    );
  });
});
