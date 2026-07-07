import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema arena fields", () => {
  it("exposes stamina and idle arena options through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "staminaLose" })
    ).toMatchObject({
      key: "staminaLose",
      kind: "number",
      default: 5,
      group: "Arena",
    });
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "idleArena" })).toMatchObject(
      {
        key: "idleArena",
        kind: "checkbox",
        default: false,
        group: "Arena",
      }
    );
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "idleArenaTime" })
    ).toMatchObject({
      key: "idleArenaTime",
      kind: "number",
      default: 0,
      group: "Arena",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "idleArenaGrTime" })
    ).toMatchObject({
      key: "idleArenaGrTime",
      kind: "number",
      default: 1,
      group: "Arena",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "restoreStamina" })
    ).toMatchObject({
      key: "restoreStamina",
      kind: "checkbox",
      default: false,
      group: "Arena",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "staminaLow" })
    ).toMatchObject({
      key: "staminaLow",
      kind: "number",
      default: 30,
      group: "Arena",
    });
  });

  it("groups stamina and idle arena options under Arena", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Arena" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(
      expect.arrayContaining([
        "staminaLose",
        "idleArena",
        "idleArenaTime",
        "idleArenaGrTime",
        "restoreStamina",
        "staminaLow",
      ])
    );
  });
});
