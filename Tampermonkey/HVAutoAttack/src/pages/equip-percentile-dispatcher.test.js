import { beforeEach, describe, expect, it, vi } from "vitest";
import { runEquipPercentileEnhancement } from "./equip-percentile-dispatcher.js";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  runOfflineEquipPercentileEnhancement: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ INFO: "info" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("./equip-percentile-offline.js", () => ({
  runOfflineEquipPercentileEnhancement: mocks.runOfflineEquipPercentileEnhancement,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("runEquipPercentileEnhancement", () => {
  it("reports live mode compatibility downgrade through typed diagnostics", () => {
    runEquipPercentileEnhancement("live");

    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "info",
      args: [
        "[HVAA] equipPercentileMode=live 已随能量模型过时，自动降级为 offline（本地品质点数公式）",
      ],
    });
    expect(mocks.runOfflineEquipPercentileEnhancement).toHaveBeenCalledOnce();
  });

  it("runs offline mode without compatibility diagnostics", () => {
    runEquipPercentileEnhancement("offline");

    expect(mocks.runDiagnosticConsoleAutomation).not.toHaveBeenCalled();
    expect(mocks.runOfflineEquipPercentileEnhancement).toHaveBeenCalledOnce();
  });
});
