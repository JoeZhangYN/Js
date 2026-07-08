import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

export const REPAIR_BACKEND_FAILURE_KEY = "HVAA:lastRepairBackendFailure";

export function recordRepairBackendFailure(failure) {
  const evidence = {
    capability: "repairBackend",
    stage: "requestFailure",
    failure,
  };
  try {
    sessionStorage.setItem(REPAIR_BACKEND_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Repair stop recovery must not depend on diagnostic storage.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] repair backend request failed", evidence],
  });
  return evidence;
}
