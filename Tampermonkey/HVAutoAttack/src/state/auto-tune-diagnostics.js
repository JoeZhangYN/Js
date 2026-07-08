import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const AUTO_TUNE_FAILURE_KEY = "HVAA:lastAutoTuneFailure";

export function recordAutoTuneFailure(stage, storageKey, error) {
  const evidence = {
    capability: "autoTune",
    stage,
    storageKey,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(AUTO_TUNE_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Auto-tune evidence is diagnostic only; battle flow must keep running.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] auto-tune persistence failed", evidence],
  });
  return evidence;
}

export function recordAutoTuneDiagnostic(stage, detail) {
  return runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.INFO,
    args: ["[HVAA] auto-tune diagnostic", { capability: "autoTune", stage, detail }],
  });
}
