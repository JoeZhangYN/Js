const NAVIGATION_AUDIT_KEY = "HVAA:lastNavigationAudit";
const NAVIGATION_CONTEXT_KEY = "HVAA:lastNavigationContext";

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

export function recordNavigationContext(kind, payload = {}) {
  writeJson(NAVIGATION_CONTEXT_KEY, {
    kind,
    ...payload,
    at: new Date().toISOString(),
    href: window.location.href,
  });
}

export function writeNavigationAudit(kind, payload) {
  const audit = {
    kind,
    ...payload,
    lastAction: readJson(NAVIGATION_CONTEXT_KEY),
    at: new Date().toISOString(),
    from: window.location.href,
  };
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
