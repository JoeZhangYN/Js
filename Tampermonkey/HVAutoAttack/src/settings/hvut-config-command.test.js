import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

import {
  SETTINGS_HVUT_CONFIG_FAILURE_KEY,
  SettingsHvutConfigCommandEvent,
  runSettingsHvutConfigCommand,
} from "./hvut-config-command.js";

beforeEach(() => {
  sessionStorage.clear();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  vi.restoreAllMocks();
});

describe("runSettingsHvutConfigCommand", () => {
  it("opens the hv-utils config panel through the typed settings command", () => {
    const bridge = vi.fn();

    expect(
      runSettingsHvutConfigCommand({
        type: SettingsHvutConfigCommandEvent.OPEN_PANEL,
        bridge,
      })
    ).toEqual({ ok: true });

    expect(bridge).toHaveBeenCalledWith(undefined);
  });

  it("records missing hv-utils config bridge evidence without throwing", () => {
    expect(
      runSettingsHvutConfigCommand({
        type: SettingsHvutConfigCommandEvent.OPEN_PANEL,
        bridge: null,
      })
    ).toMatchObject({
      ok: false,
      reason: "missingHvutConfigBridge",
      evidence: { capability: "settingsHvutConfig", stage: "open-panel" },
    });
    expect(JSON.parse(sessionStorage.getItem(SETTINGS_HVUT_CONFIG_FAILURE_KEY))).toMatchObject({
      source: "settingsHvutConfig",
      detail: { reason: "missingHvutConfigBridge" },
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] settings HVUT config failed",
        expect.objectContaining({ capability: "settingsHvutConfig", stage: "open-panel" }),
      ],
    });
  });

  it("records hv-utils config bridge failures without claiming success", () => {
    const bridge = vi.fn(() => {
      throw new Error("bridge blocked");
    });

    expect(
      runSettingsHvutConfigCommand({
        type: SettingsHvutConfigCommandEvent.OPEN_PANEL,
        bridge,
      })
    ).toMatchObject({
      ok: false,
      reason: "hvutConfigBridgeFailed",
      evidence: { detail: { error: "bridge blocked" } },
    });
  });

  it("rejects unknown and null settings hv-utils config events", () => {
    expect(runSettingsHvutConfigCommand({ type: "unknown" })).toBeUndefined();
    expect(runSettingsHvutConfigCommand(null)).toBeUndefined();
  });

  it("keeps settings command failure handling when diagnostics are blocked", () => {
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === SETTINGS_HVUT_CONFIG_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });

    expect(() =>
      runSettingsHvutConfigCommand({
        type: SettingsHvutConfigCommandEvent.OPEN_PANEL,
        bridge: null,
      })
    ).not.toThrow();
  });
});
