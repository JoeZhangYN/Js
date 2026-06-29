import { describe, expect, it, vi } from "vitest";
import { EquipmentViewEvent, runEquipmentViewAutomation } from "./equipment-view-automation.js";
import { PageKind } from "./page-kind.js";

function pageReady(kind) {
  return { type: EquipmentViewEvent.PAGE_READY, kind };
}

describe("runEquipmentViewAutomation", () => {
  it("runs forge cost only for showequip pages with the option enabled", () => {
    const runForgeCostEnhancement = vi.fn();
    const runEquipPercentileEnhancement = vi.fn();

    expect(
      runEquipmentViewAutomation(pageReady(PageKind.SHOWEQUIP), {
        readOptionField: () => "off",
        readOptionEnabled: () => true,
        runEquipPercentileEnhancement,
        runForgeCostEnhancement,
      })
    ).toBe(true);

    expect(runForgeCostEnhancement).toHaveBeenCalledTimes(1);
    expect(runEquipPercentileEnhancement).not.toHaveBeenCalled();
  });

  it("runs percentile enhancement when the percentile mode is enabled", () => {
    const runForgeCostEnhancement = vi.fn();
    const runEquipPercentileEnhancement = vi.fn();

    expect(
      runEquipmentViewAutomation(pageReady(PageKind.LOBBY), {
        readOptionField: () => "offline",
        readOptionEnabled: () => false,
        runEquipPercentileEnhancement,
        runForgeCostEnhancement,
      })
    ).toBe(true);

    expect(runForgeCostEnhancement).not.toHaveBeenCalled();
    expect(runEquipPercentileEnhancement).toHaveBeenCalledWith("offline");
  });

  it("passes live mode to the percentile executor for compatibility downgrade", () => {
    const runForgeCostEnhancement = vi.fn();
    const runEquipPercentileEnhancement = vi.fn();

    expect(
      runEquipmentViewAutomation(pageReady(PageKind.SHOWEQUIP), {
        readOptionField: () => "live",
        readOptionEnabled: () => false,
        runEquipPercentileEnhancement,
        runForgeCostEnhancement,
      })
    ).toBe(true);

    expect(runForgeCostEnhancement).not.toHaveBeenCalled();
    expect(runEquipPercentileEnhancement).toHaveBeenCalledWith("live");
  });

  it("does nothing when no equipment enhancement is enabled", () => {
    const runForgeCostEnhancement = vi.fn();
    const runEquipPercentileEnhancement = vi.fn();

    expect(
      runEquipmentViewAutomation(pageReady(PageKind.LOBBY), {
        readOptionField: () => "off",
        readOptionEnabled: () => false,
        runEquipPercentileEnhancement,
        runForgeCostEnhancement,
      })
    ).toBe(false);

    expect(runForgeCostEnhancement).not.toHaveBeenCalled();
    expect(runEquipPercentileEnhancement).not.toHaveBeenCalled();
  });
});
