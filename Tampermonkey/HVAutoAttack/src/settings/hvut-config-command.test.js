import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SETTINGS_HVUT_CONFIG_FAILURE_KEY,
  SettingsHvutConfigCommandEvent,
  runSettingsHvutConfigCommand,
} from "./hvut-config-command.js";

beforeEach(() => {
  sessionStorage.clear();
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
    vi.spyOn(console, "warn").mockImplementation(() => {});

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
  });

  it("records hv-utils config bridge failures without claiming success", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
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
});
