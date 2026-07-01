import { DiagnosticEvidenceKey } from "./diagnostic-evidence-keys.js";
import { readRecentDiagnosticEvidence } from "./diagnostic-evidence.js";

const NAVIGATION_AUDIT_KEY = DiagnosticEvidenceKey.NAVIGATION_AUDIT;

function writeJson(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (_error) {
    // Diagnostics must not break gameplay when browser storage is unavailable.
  }
}

export function writeNavigationAudit(kind, payload) {
  const audit = {
    kind,
    ...payload,
    at: new Date().toISOString(),
    from: window.location.href,
  };
  const diagnosticEvidence = readRecentDiagnosticEvidence(sessionStorage);
  if (diagnosticEvidence) audit.diagnosticEvidence = diagnosticEvidence;
  writeJson(NAVIGATION_AUDIT_KEY, audit);
  console.warn(`[HVAA] ${kind}`, audit);
}

export function reportPreviousNavigationAudit() {
  let raw;
  try {
    raw = sessionStorage.getItem(NAVIGATION_AUDIT_KEY);
    if (raw) sessionStorage.removeItem(NAVIGATION_AUDIT_KEY);
  } catch (_error) {
    return;
  }
  if (!raw) return;
  try {
    console.warn("[HVAA] previous navigation", JSON.parse(raw));
  } catch (_error) {
    console.warn("[HVAA] previous navigation", raw);
  }
}

export function installExternalUnloadAudit() {
  const recordExternalUnload = (event) => {
    try {
      if (sessionStorage.getItem(NAVIGATION_AUDIT_KEY)) return;
    } catch (_error) {
      return;
    }
    writeNavigationAudit("externalUnload", {
      reason: "outsideNavigationEntry",
      eventType: event.type,
    });
  };
  window.addEventListener("pagehide", recordExternalUnload);
  window.addEventListener("beforeunload", recordExternalUnload);
}
