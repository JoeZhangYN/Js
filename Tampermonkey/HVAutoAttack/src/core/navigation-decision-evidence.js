import { DiagnosticConsoleEvent, runDiagnosticConsoleAutomation } from "./diagnostic-console.js";
import { DiagnosticEvidenceKey } from "./diagnostic-evidence-keys.js";

const NAVIGATION_DECISION_KEY = DiagnosticEvidenceKey.NAVIGATION_DECISION;

function warnNavigationDecision(evidence) {
  return runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] navigation decision", evidence],
  });
}

function navigationDecisionStorage() {
  return globalThis.sessionStorage ?? window.sessionStorage;
}

export function recordNavigationDecision(decision, event, detail) {
  const evidence = {
    decision,
    eventType: event?.type ?? null,
    commandReason: event?.reason ?? null,
    detail,
    at: new Date().toISOString(),
  };
  try {
    navigationDecisionStorage().setItem(
      NAVIGATION_DECISION_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    warnNavigationDecision(evidence);
    return false;
  }
  warnNavigationDecision(evidence);
  return true;
}
