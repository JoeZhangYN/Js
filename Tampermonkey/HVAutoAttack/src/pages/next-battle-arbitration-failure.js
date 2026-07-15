import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export function recordNextBattleArbitrationFailure(stage, error) {
  return runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: [
      "[HVAA] next battle arbitration failed",
      { stage, error: error?.message || String(error) },
    ],
  });
}
