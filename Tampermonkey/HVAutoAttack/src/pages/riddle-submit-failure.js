import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const RIDDLE_SUBMIT_FAILURE_KEY = "HVAA:lastRiddleSubmitFailure";

export function recordRiddleSubmitFailure(stage, detail = {}) {
  const evidence = { capability: "riddleSubmit", stage, detail };
  try {
    globalThis.sessionStorage?.setItem(RIDDLE_SUBMIT_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Riddle submit fallback must not depend on diagnostic storage.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA][riddle] submit failed", evidence],
  });
  return evidence;
}
