import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema main control fields", () => {
  it("exposes attack mode selection through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "attackStatus" })
    ).toMatchObject({
      key: "attackStatus",
      kind: "select",
      default: -1,
      group: "Main",
      enum: ["-1", "0", "1", "2", "3", "4", "5", "6"],
      enumLabel: {
        "-1": "",
        0: "物理 / Physical",
        1: "火 / Fire",
        2: "冰 / Cold",
        3: "雷 / Elec",
        4: "风 / Wind",
        5: "圣 / Divine",
        6: "暗 / Forbidden",
      },
    });
  });

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
        "attackStatus",
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
