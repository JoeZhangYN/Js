import { describe, expect, it } from "vitest";
import {
  hasSettingsInputClass,
  readCustomizeHoverTarget,
  readSelectableReportTableTarget,
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

  it("reads customize hover targets without assuming parent depth", () => {
    const root = { className: "customize active", parentNode: null };
    const child = { className: "customizeGroup", parentNode: root };
    const leaf = { className: "", parentNode: child };

    expect(readCustomizeHoverTarget(root)).toBe(root);
    expect(readCustomizeHoverTarget(leaf)).toBe(root);
    expect(readCustomizeHoverTarget({ className: "", parentNode: null })).toBeNull();
    expect(readCustomizeHoverTarget(null)).toBeNull();
  });

  it("reads selectable report tables without assuming parent depth", () => {
    const table = { tagName: "TABLE", parentNode: null };
    const tbody = { tagName: "TBODY", parentNode: table };
    const row = { tagName: "TR", parentNode: tbody };
    const cell = { tagName: "TD", parentNode: row };
    const icon = { tagName: "SPAN", parentNode: cell };

    expect(readSelectableReportTableTarget(icon)).toBe(table);
    expect(readSelectableReportTableTarget(cell)).toBe(table);
    expect(readSelectableReportTableTarget({ tagName: "DIV", parentNode: null })).toBeNull();
    expect(readSelectableReportTableTarget(null)).toBeNull();
  });
});
