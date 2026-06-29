import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema", () => {
  it("reads option schema fields through the event entry", () => {
    const field = runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "repairValue" });

    expect(field).toMatchObject({ key: "repairValue", kind: "number", default: 60 });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "equipPercentileMode" })
    ).toMatchObject({
      enum: ["off", "offline", "live"],
      enumLabel: {
        off: "off (关闭)",
        offline: "offline (本地公式)",
        live: "live (已并入 offline)",
      },
    });
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "mlEndpoint" })).toMatchObject(
      {
        key: "mlEndpoint",
        kind: "text",
        default: "https://rdma.ooguy.com/help2",
      }
    );
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "criticalBuffsList" })
    ).toMatchObject({
      key: "criticalBuffsList",
      kind: "text",
      default: "Hastened,Protection,Spark of Life",
    });
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_DEFAULT, key: "repairValue" })).toBe(60);
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Debuff" }).some(
        (item) => item.key === "skipDebuffForBigSkill_We"
      )
    ).toBe(true);
  });

  it("keeps missing schema reads explicit", () => {
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "missing" })).toBeUndefined();
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_DEFAULT, key: "missing" })
    ).toBeUndefined();
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "missing" })).toEqual([]);
    expect(runOptionSchema({ type: "unknown" })).toBeUndefined();
  });
});
