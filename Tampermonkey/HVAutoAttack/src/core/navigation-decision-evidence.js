import { DiagnosticEvidenceKey } from "./diagnostic-evidence-keys.js";

const NAVIGATION_DECISION_KEY = DiagnosticEvidenceKey.NAVIGATION_DECISION;

export function recordNavigationDecision(decision, event, detail) {
  const evidence = {
    decision,
    eventType: event?.type ?? null,
    commandReason: event?.reason ?? null,
    detail,
    at: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(
      NAVIGATION_DECISION_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    console.warn("[HVAA] navigation decision", evidence);
    return false;
  }
  console.warn("[HVAA] navigation decision", evidence);
  return true;
}
