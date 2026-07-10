import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

const errorText = (error) => error?.message || String(error);

function clearMirroredIncident() {
  try {
    globalThis.sessionStorage?.removeItem(DiagnosticEvidenceKey.ENCOUNTER_GENERATION_INCIDENT);
    return { ok: true, scope: "originSession" };
  } catch (error) {
    return { ok: false, scope: "originSession", error: errorText(error) };
  }
}

export function clearEncounterGenerationIncident(authority) {
  const mirror = clearMirroredIncident();
  if (authority.authority === "unavailable") {
    return { ok: false, kind: "clearFailed", ...authority, mirror };
  }
  if (authority.authority === "session") {
    return mirror.ok
      ? { ok: true, kind: "cleared", ...authority, mirror }
      : { ok: false, kind: "clearFailed", ...authority, reason: "sessionClearFailed", mirror };
  }
  try {
    GM_setValue(DiagnosticEvidenceKey.ENCOUNTER_GENERATION_INCIDENT, null);
    return { ok: true, kind: "cleared", ...authority, mirror };
  } catch (error) {
    return {
      ok: false,
      kind: "clearFailed",
      ...authority,
      reason: "gmClearFailed",
      error: errorText(error),
      mirror,
    };
  }
}
