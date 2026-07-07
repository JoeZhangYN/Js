import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema equipment fields", () => {
  it("exposes repair workflow options through the schema entry", () => {
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "repair" })).toMatchObject({
      key: "repair",
      kind: "checkbox",
      default: false,
      group: "Main",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Main" }).map(
        (field) => field.key
      )
    ).toEqual(expect.arrayContaining(["repair", "repairValue", "repairBuyMaterials"]));
  });

  it("exposes equipment view enhancement options through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "forgeCostShow" })
    ).toMatchObject({
      key: "forgeCostShow",
      kind: "checkbox",
      default: true,
      defaultOn: true,
      group: "Main",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "equipPercentileMode" })
    ).toMatchObject({
      key: "equipPercentileMode",
      kind: "select",
      default: "off",
      group: "Main",
      enum: ["off", "offline", "live"],
      enumLabel: {
        off: "off (关闭)",
        offline: "offline (本地公式)",
        live: "live (已并入 offline)",
      },
    });
  });
});
