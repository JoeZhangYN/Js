import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

const EVENT_OPEN_PANEL = "openPanel";

export const SETTINGS_HVUT_CONFIG_FAILURE_KEY = "HVAA:lastSettingsHvutConfigFailure";

export const SettingsHvutConfigCommandEvent = Object.freeze({
  OPEN_PANEL: EVENT_OPEN_PANEL,
});

function recordSettingsHvutConfigFailure(stage, detail = {}) {
  const evidence = {
    capability: "settingsHvutConfig",
    source: "settingsHvutConfig",
    stage,
    detail,
  };
  try {
    globalThis.sessionStorage?.setItem(SETTINGS_HVUT_CONFIG_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Settings bridge diagnostics must not block the settings panel.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] settings HVUT config failed", evidence],
  });
  return evidence;
}

function openHvutConfigPanel(event = {}) {
  const bridge = event.bridge || globalThis.window?.HVUT_openConfig;
  if (typeof bridge !== "function") {
    return {
      ok: false,
      reason: "missingHvutConfigBridge",
      evidence: recordSettingsHvutConfigFailure("open-panel", {
        reason: "missingHvutConfigBridge",
      }),
    };
  }
  try {
    bridge(event.key);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "hvutConfigBridgeFailed",
      evidence: recordSettingsHvutConfigFailure("open-panel", {
        reason: "hvutConfigBridgeFailed",
        error: error?.message || String(error),
      }),
    };
  }
}

const settingsHvutConfigCommandHandlers = Object.freeze({
  [EVENT_OPEN_PANEL]: openHvutConfigPanel,
});

export function runSettingsHvutConfigCommand(event = { type: EVENT_OPEN_PANEL }) {
  return settingsHvutConfigCommandHandlers[event?.type]?.(event);
}
