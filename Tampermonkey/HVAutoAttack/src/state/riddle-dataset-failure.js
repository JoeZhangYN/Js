import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const RIDDLE_DATASET_FAILURE_KEY = "HVAA:lastRiddleDatasetFailure";

export function recordRiddleDatasetFailure(stage, detail = {}) {
  const evidence = { capability: "riddleDataset", stage, detail };
  try {
    globalThis.sessionStorage?.setItem(RIDDLE_DATASET_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Dataset fallback must not depend on diagnostic storage.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA][RMA] riddle dataset failed", { stage, detail }],
  });
  return evidence;
}
