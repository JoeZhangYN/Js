import { describe, expect, it } from "vitest";
import { getHvutConfigCarryKeys, getHvutConfigNamespace } from "./hvut-config-migration.js";

describe("HVUT config migration", () => {
  it("selects the storage namespace from segment identity", () => {
    expect(getHvutConfigNamespace({ isIsekai: false })).toBe("hvut");
    expect(getHvutConfigNamespace({ isIsekai: true })).toBe("hvuti");
  });

  it("keeps persistent-only legacy equipment names in persistent migration", () => {
    expect(getHvutConfigCarryKeys({ isIsekai: false })).toEqual([
      "equipnames",
      "equipset",
      "ch_style",
      "se_settings",
      "ss_log",
      "ml_log",
    ]);
  });

  it("does not carry persistent-only legacy equipment names in Isekai migration", () => {
    expect(getHvutConfigCarryKeys({ isIsekai: true })).toEqual([
      "equipset",
      "ch_style",
      "se_settings",
      "ss_log",
      "ml_log",
    ]);
  });
});
