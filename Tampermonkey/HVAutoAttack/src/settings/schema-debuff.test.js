import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema debuff smart-skip fields", () => {
  it("exposes big-skill debuff skip options through the schema entry", () => {
    for (const key of [
      "skipDebuffForBigSkill_We",
      "skipDebuffForBigSkill_Im",
      "skipWeakenWhenClearReady",
    ]) {
      expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key })).toMatchObject({
        key,
        kind: "checkbox",
        default: true,
        defaultOn: true,
        group: "Debuff",
      });
    }

    for (const key of ["debuffSkillAllIm", "debuffSkillAllWk"]) {
      expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key })).toMatchObject({
        key,
        kind: "checkbox",
        default: false,
        group: "Debuff",
      });
    }

    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "skipImperilWhenOfcKills" })
    ).toMatchObject({
      key: "skipImperilWhenOfcKills",
      kind: "checkbox",
      default: false,
      group: "Debuff",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "bigKillMinSamples" })
    ).toMatchObject({ key: "bigKillMinSamples", kind: "number", default: 4, group: "Debuff" });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "bigKillProbThreshold" })
    ).toMatchObject({
      key: "bigKillProbThreshold",
      kind: "number",
      default: 0.9,
      group: "Debuff",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "bigKillScaleDriftTol" })
    ).toMatchObject({
      key: "bigKillScaleDriftTol",
      kind: "number",
      default: 1.15,
      group: "Debuff",
    });
  });
});
