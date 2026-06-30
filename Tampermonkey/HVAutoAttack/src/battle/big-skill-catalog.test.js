import { describe, expect, it } from "vitest";
import { bigSkillCodes, isBigSkillEnabled, readBigSkillSpec } from "./big-skill-catalog.js";

describe("big skill catalog", () => {
  it("owns OFC/FRD skill ids and overcharge requirements", () => {
    expect(bigSkillCodes()).toEqual(["OFC", "FRD"]);
    expect(readBigSkillSpec("OFC")).toEqual({ id: "1111", oc: 205 });
    expect(readBigSkillSpec("FRD")).toEqual({ id: "1101", oc: 105 });
  });

  it("recognizes flat and nested option enablement", () => {
    expect(isBigSkillEnabled({ skill_OFC: true }, "OFC")).toBe(true);
    expect(isBigSkillEnabled({ skill: { FRD: true } }, "FRD")).toBe(true);
    expect(isBigSkillEnabled({}, "OFC")).toBe(false);
  });
});
