import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

const tabSwitches = [
  ["buffSkillSwitch", "Buff"],
  ["debuffSkillSwitch", "Debuff"],
  ["skillSwitch", "Skill"],
  ["scrollSwitch", "Scroll"],
  ["scrollFirst", "Scroll"],
];

describe("runOptionSchema battle tab switch fields", () => {
  it("exposes battle tab switches through the schema entry", () => {
    for (const [key, group] of tabSwitches) {
      expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key })).toMatchObject({
        key,
        kind: "checkbox",
        default: false,
        group,
      });
    }
  });

  it("groups each battle tab switch under its tab identity", () => {
    for (const [key, group] of tabSwitches) {
      const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group }).map(
        (field) => field.key
      );

      expect(keys).toEqual(expect.arrayContaining([key]));
    }
  });
});
