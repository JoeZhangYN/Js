import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema physical skill strategy fields", () => {
  it("exposes fighting style and merciful blow options through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "fightingStyle" })
    ).toMatchObject({
      key: "fightingStyle",
      kind: "select",
      default: "1",
      group: "Skill",
      enum: ["1", "2", "3", "4", "5"],
      enumLabel: {
        1: "二天一流 / Niten Ichiryu",
        2: "单手 / One-Handed",
        3: "双手 / 2-Handed Weapon",
        4: "双持 / Dual Wielding",
        5: "法杖 / Staff",
      },
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "mercifulBlow" })
    ).toMatchObject({
      key: "mercifulBlow",
      kind: "checkbox",
      default: false,
      group: "Skill",
    });
  });

  it("exposes physical skill downgrade options through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "utilityWeightLearning" })
    ).toMatchObject({
      key: "utilityWeightLearning",
      kind: "checkbox",
      default: false,
      group: "Skill",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "physicalSkillDowngrade" })
    ).toMatchObject({
      key: "physicalSkillDowngrade",
      kind: "checkbox",
      default: true,
      defaultOn: true,
      group: "Skill",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "physicalDowngradeThreshold" })
    ).toMatchObject({
      key: "physicalDowngradeThreshold",
      kind: "number",
      default: 3,
      group: "Skill",
    });
  });

  it("groups physical skill strategy options under Skill", () => {
    const keys = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Skill" }).map(
      (field) => field.key
    );

    expect(keys).toEqual(
      expect.arrayContaining([
        "fightingStyle",
        "utilityWeightLearning",
        "mercifulBlow",
        "physicalSkillDowngrade",
        "physicalDowngradeThreshold",
      ])
    );
  });
});
