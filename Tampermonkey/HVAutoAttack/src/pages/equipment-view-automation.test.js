import { describe, expect, it, vi } from "vitest";
import {
  EquipmentViewEvent,
  runEquipmentViewAutomation,
} from "./equipment-view-automation.js";
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
        getOption: () => "off",
        isOptionOn: () => true,
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
        getOption: () => "offline",
        isOptionOn: () => false,
        runEquipPercentileEnhancement,
        runForgeCostEnhancement,
      })
    ).toBe(true);

    expect(runForgeCostEnhancement).not.toHaveBeenCalled();
    expect(runEquipPercentileEnhancement).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no equipment enhancement is enabled", () => {
    const runForgeCostEnhancement = vi.fn();
    const runEquipPercentileEnhancement = vi.fn();

    expect(
      runEquipmentViewAutomation(pageReady(PageKind.LOBBY), {
        getOption: () => "off",
        isOptionOn: () => false,
        runEquipPercentileEnhancement,
        runForgeCostEnhancement,
      })
    ).toBe(false);

    expect(runForgeCostEnhancement).not.toHaveBeenCalled();
    expect(runEquipPercentileEnhancement).not.toHaveBeenCalled();
  });
});
