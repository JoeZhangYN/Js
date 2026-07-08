import { DiagnosticConsoleEvent, runDiagnosticConsoleAutomation } from "./diagnostic-console.js";
import { DiagnosticEvidenceKey } from "./diagnostic-evidence-keys.js";
import { readRecentDiagnosticEvidence } from "./diagnostic-evidence.js";

const NAVIGATION_AUDIT_KEY = DiagnosticEvidenceKey.NAVIGATION_AUDIT;

function writeJson(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ...value, storageWriteOk: true }));
    return { storageWriteOk: true };
  } catch (_error) {
    return { storageWriteOk: false, storageWriteError: _error?.message || String(_error) };
  }
}

function warnNavigationAudit(kind, audit) {
  return runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: [`[HVAA] ${kind}`, audit],
  });
}

export function writeNavigationAudit(kind, payload) {
  const audit = {
    kind,
    ...payload,
    at: new Date().toISOString(),
    from: window.location.href,
  };
  const diagnosticEvidence = readRecentDiagnosticEvidence(sessionStorage, {
    excludeKeys: [NAVIGATION_AUDIT_KEY],
  });
  if (diagnosticEvidence) audit.diagnosticEvidence = diagnosticEvidence;
  Object.assign(audit, writeJson(NAVIGATION_AUDIT_KEY, audit));
  warnNavigationAudit(kind, audit);
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
    warnNavigationAudit("previous navigation", JSON.parse(raw));
  } catch (_error) {
    warnNavigationAudit("previous navigation", raw);
  }
}

export function installExternalUnloadAudit() {
  const recordExternalUnload = (event) => {
    try {
      if (sessionStorage.getItem(NAVIGATION_AUDIT_KEY)) return;
    } catch (_error) {
      // Storage may be unavailable during unload; still emit diagnostic evidence.
    }
    writeNavigationAudit("externalUnload", {
      reason: "outsideNavigationEntry",
      eventType: event.type,
    });
  };
  window.addEventListener("pagehide", recordExternalUnload);
  window.addEventListener("beforeunload", recordExternalUnload);
}
