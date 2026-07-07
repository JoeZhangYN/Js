import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema system delay fields", () => {
  it("exposes action delay watchdog options through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "delayAlert" })
    ).toMatchObject({
      key: "delayAlert",
      kind: "checkbox",
      default: false,
      group: "System",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "delayAlertTime" })
    ).toMatchObject({
      key: "delayAlertTime",
      kind: "number",
      default: 0,
      group: "System",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "delayReload" })
    ).toMatchObject({
      key: "delayReload",
      kind: "checkbox",
      default: false,
      group: "System",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "delayReloadTime" })
    ).toMatchObject({
      key: "delayReloadTime",
      kind: "number",
      default: 0,
      group: "System",
    });
  });

  it("groups action delay watchdog options under System", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "System" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(
      expect.arrayContaining(["delayAlert", "delayAlertTime", "delayReload", "delayReloadTime"])
    );
  });

  it("exposes monitor archive and API bridge delay options through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "recordEach" })
    ).toMatchObject({
      key: "recordEach",
      kind: "checkbox",
      default: false,
      group: "System",
    });
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "delay" })).toMatchObject({
      key: "delay",
      kind: "number",
      default: 200,
      group: "System",
    });
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "delay2" })).toMatchObject({
      key: "delay2",
      kind: "number",
      default: 30,
      group: "System",
    });
  });

  it("groups monitor archive and API bridge delay options under System", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "System" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(expect.arrayContaining(["recordEach", "delay", "delay2"]));
  });
});
