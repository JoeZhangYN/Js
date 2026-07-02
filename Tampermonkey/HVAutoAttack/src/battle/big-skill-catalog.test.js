import { describe, expect, it } from "vitest";
import { BigSkillCatalogEvent, runBigSkillCatalog } from "./big-skill-catalog.js";

describe("big skill catalog", () => {
  it("owns OFC/FRD skill ids and overcharge requirements", () => {
    expect(runBigSkillCatalog({ type: BigSkillCatalogEvent.READ_CODES })).toEqual(["OFC", "FRD"]);
    expect(runBigSkillCatalog({ type: BigSkillCatalogEvent.READ_SPEC, code: "OFC" })).toEqual({
      id: "1111",
      oc: 205,
    });
    expect(runBigSkillCatalog({ type: BigSkillCatalogEvent.READ_SPEC, code: "FRD" })).toEqual({
      id: "1101",
      oc: 105,
    });
  });

  it("recognizes flat and nested option enablement", () => {
    expect(
      runBigSkillCatalog({
        type: BigSkillCatalogEvent.IS_ENABLED,
        opt: { skill_OFC: true },
        code: "OFC",
      })
    ).toBe(true);
    expect(
      runBigSkillCatalog({
        type: BigSkillCatalogEvent.IS_ENABLED,
        opt: { skill: { FRD: true } },
        code: "FRD",
      })
    ).toBe(true);
    expect(
      runBigSkillCatalog({ type: BigSkillCatalogEvent.IS_ENABLED, opt: {}, code: "OFC" })
    ).toBe(false);
  });

  it("rejects invalid catalog events", () => {
    expect(runBigSkillCatalog({ type: "unknown" })).toBeUndefined();
    expect(runBigSkillCatalog(null)).toBeUndefined();
  });
});
