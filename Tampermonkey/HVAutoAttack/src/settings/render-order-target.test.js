import { describe, expect, it } from "vitest";
import {
  hasSettingsInputClass,
  readSingleOrderItemName,
  shouldHydrateSettingsInput,
} from "./render.js";

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

describe("settings input class classification", () => {
  it("classifies settings hydration classes by token", () => {
    expect(shouldHydrateSettingsInput({ className: "hvAADebug hvAANumber" })).toBe(false);
    expect(shouldHydrateSettingsInput({ className: "hvAANumber extra" })).toBe(true);
    expect(hasSettingsInputClass("hvAACustomize active", "hvAACustomize")).toBe(true);
  });
});
