import { describe, expect, it } from "vitest";
import { readSingleOrderItemName } from "./render.js";

describe("readSingleOrderItemName", () => {
  it("reads the order item suffix from checkbox ids", () => {
    expect(readSingleOrderItemName({ id: "skill_Fireball" })).toBe("Fireball");
  });

  it("fails closed for malformed order event targets", () => {
    expect(readSingleOrderItemName({ id: "skill" })).toBeNull();
    expect(readSingleOrderItemName({})).toBeNull();
    expect(readSingleOrderItemName(null)).toBeNull();
  });
});
