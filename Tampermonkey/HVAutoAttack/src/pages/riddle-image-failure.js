import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const RIDDLE_IMAGE_FAILURE_KEY = "HVAA:lastRiddleImageFailure";

export function recordRiddleImageFailure(stage, detail = {}) {
  const evidence = { capability: "riddleImage", stage, detail };
  try {
    globalThis.sessionStorage?.setItem(RIDDLE_IMAGE_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Riddle image fallback must not depend on diagnostic storage.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA][RMA] riddle image failed", evidence],
  });
  return evidence;
}
