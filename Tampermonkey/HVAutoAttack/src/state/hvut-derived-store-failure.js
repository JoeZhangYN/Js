import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

export const HVUT_DERIVED_STORE_FAILURE_KEY = DiagnosticEvidenceKey.HVUT_DERIVED_STORE_FAILURE;

export function recordHvutDerivedStoreFailure(stage, family, error) {
  const evidence = {
    capability: "hvutDerivedStore",
    stage,
    family,
    error: error?.message || String(error),
  };
  try {
    sessionStorage.setItem(HVUT_DERIVED_STORE_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Storage failure reporting must not depend on session storage.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] HVUT derived storage failed", evidence],
  });
  return evidence;
}
