import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EQUIPMENT_PERCENTILE_FAILURE_KEY,
  persistEquipmentPercentilePreference,
  recordEquipmentPercentilePreferenceReadFailure,
} from "./equip-percentile-failure.js";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

function lastFailure() {
  return JSON.parse(sessionStorage.getItem(EQUIPMENT_PERCENTILE_FAILURE_KEY));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  vi.restoreAllMocks();
});

describe("equipment percentile failure evidence", () => {
  it("records preference persistence failures without throwing", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === "hvAA_equipPercentile_offline_showPercent") {
        throw new Error("preference write blocked");
      }
      return originalSetItem.call(this, key, value);
    });

    expect(
      persistEquipmentPercentilePreference("hvAA_equipPercentile_offline_showPercent", false)
    ).toBe(false);
    expect(lastFailure()).toMatchObject({
      capability: "equipmentPercentile",
      stage: "persist-preference",
      detail: {
        key: "hvAA_equipPercentile_offline_showPercent",
        value: false,
        error: "preference write blocked",
      },
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] equipment percentile failed",
        expect.objectContaining({
          capability: "equipmentPercentile",
          stage: "persist-preference",
        }),
      ],
    });
  });

  it("records preference read failures as project diagnostics", () => {
    recordEquipmentPercentilePreferenceReadFailure(
      "hvAA_equipPercentile_offline_showPercent",
      new Error("preference read blocked")
    );

    expect(lastFailure()).toMatchObject({
      capability: "equipmentPercentile",
      stage: "read-preference",
      detail: { key: "hvAA_equipPercentile_offline_showPercent", error: "preference read blocked" },
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] equipment percentile failed",
        expect.objectContaining({
          capability: "equipmentPercentile",
          stage: "read-preference",
        }),
      ],
    });
  });

  it("keeps preference fallback when evidence and typed warning diagnostics fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === "hvAA_equipPercentile_offline_showPercent")
        throw new Error("preference write blocked");
      if (key === EQUIPMENT_PERCENTILE_FAILURE_KEY) throw new Error("session blocked");
      return originalSetItem.call(this, key, value);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);

    expect(() =>
      persistEquipmentPercentilePreference("hvAA_equipPercentile_offline_showPercent", false)
    ).not.toThrow();
  });
});
