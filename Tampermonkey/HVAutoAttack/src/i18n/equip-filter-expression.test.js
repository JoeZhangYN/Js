import { describe, expect, it } from "vitest";
import { evaluateEquipFilterExpression } from "./equip-filter-expression.js";

describe("evaluateEquipFilterExpression", () => {
  it("evaluates boolean filters without dynamic execution", () => {
    expect(evaluateEquipFilterExpression("true && (false || !false)")).toBe(true);
    expect(evaluateEquipFilterExpression("true && false || false")).toBe(false);
  });

  it("supports level comparisons used by equipment filters", () => {
    expect(evaluateEquipFilterExpression("450 >= 400 && 450 < 500")).toBe(true);
    expect(evaluateEquipFilterExpression("300 > 400 || true")).toBe(true);
  });

  it("accepts outer whitespace from text filter replacement", () => {
    expect(evaluateEquipFilterExpression(" true && (false || true) ")).toBe(true);
  });

  it("rejects unsupported expression syntax", () => {
    expect(() => evaluateEquipFilterExpression("true; alert(1)")).toThrow("Invalid Filter");
    expect(() => evaluateEquipFilterExpression("true ?? false")).toThrow("Invalid Filter");
  });
});
