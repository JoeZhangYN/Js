import { describe, expect, it } from "vitest";
import { getHvutConfigCarryKeys } from "./hvut-config-migration.js";

describe("HVUT config migration", () => {
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
