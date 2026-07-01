import { DiagnosticEvidenceKey } from "./diagnostic-evidence-keys.js";

const NAVIGATION_AUDIT_KEY = DiagnosticEvidenceKey.NAVIGATION_AUDIT;

function readJson(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch (_error) {
    return undefined;
  }
}

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
  const diagnosticEvidence = readRecentDiagnosticEvidence();
  if (diagnosticEvidence) audit.diagnosticEvidence = diagnosticEvidence;
  writeJson(NAVIGATION_AUDIT_KEY, audit);
  console.warn(`[HVAA] ${kind}`, audit);
}

function readRecentDiagnosticEvidence() {
  const evidence = {};
  const battleActionDecision = readJson(DiagnosticEvidenceKey.BATTLE_ACTION_DECISION);
  if (battleActionDecision) evidence.battleActionDecision = battleActionDecision;
  const battleActionEffect = readJson(DiagnosticEvidenceKey.BATTLE_ACTION_EFFECT);
  if (battleActionEffect) evidence.battleActionEffect = battleActionEffect;
  return Object.keys(evidence).length ? evidence : undefined;
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
