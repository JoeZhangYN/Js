import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

export function recordBattleActionUsageCaptureFailure(stage, detail = {}) {
  const evidence = { capability: "battleActionUsageCapture", stage, detail };
  try {
    globalThis.sessionStorage?.setItem(
      DiagnosticEvidenceKey.BATTLE_ACTION_USAGE_CAPTURE_FAILURE,
      JSON.stringify(evidence)
    );
  } catch {
    // Usage capture failure evidence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] battle action usage capture failed", evidence],
  });
  return evidence;
}
