import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { clearEncounterGenerationIncident } from "./encounter-generation-incident-clear.js";

const EVENT_RECORD = "record";
const EVENT_MARK_DISPLAYED = "markDisplayed";
const EVENT_READ_ACTIVE = "readActive";
const EVENT_CLEAR = "clear";
const displayedIncidentIds = new Set();

export const EncounterGenerationIncidentEvent = Object.freeze({
  RECORD: EVENT_RECORD,
  MARK_DISPLAYED: EVENT_MARK_DISPLAYED,
  READ_ACTIVE: EVENT_READ_ACTIVE,
  CLEAR: EVENT_CLEAR,
});

function errorText(error) {
  return error?.message || String(error);
}

function mirrorIncident(incident) {
  try {
    globalThis.sessionStorage?.setItem(
      DiagnosticEvidenceKey.ENCOUNTER_GENERATION_INCIDENT,
      JSON.stringify(incident)
    );
    return { ok: true, scope: "originSession" };
  } catch (error) {
    return { ok: false, scope: "originSession", error: errorText(error) };
  }
}

function selectAuthority() {
  const hasGet = typeof GM_getValue === "function";
  const hasSet = typeof GM_setValue === "function";
  if (hasGet && hasSet) return { authority: "gm", scope: "crossOrigin" };
  if (!hasGet && !hasSet) return { authority: "session", scope: "originSession" };
  return { authority: "unavailable", scope: "none", reason: "partialGmStorage" };
}

function readStoredIncident(authority) {
  try {
    if (authority.authority === "gm") {
      return GM_getValue(DiagnosticEvidenceKey.ENCOUNTER_GENERATION_INCIDENT, null);
    }
    const raw = globalThis.sessionStorage?.getItem(
      DiagnosticEvidenceKey.ENCOUNTER_GENERATION_INCIDENT
    );
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readMirroredIncident() {
  try {
    const raw = globalThis.sessionStorage?.getItem(
      DiagnosticEvidenceKey.ENCOUNTER_GENERATION_INCIDENT
    );
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readActiveIncident() {
  const stored = readStoredIncident(selectAuthority());
  return stored || readMirroredIncident();
}

function clearIncident(event) {
  const authority = selectAuthority();
  if (event.incident?.id) displayedIncidentIds.delete(event.incident.id);
  return clearEncounterGenerationIncident(authority);
}

function persistIncident(incident, authority) {
  const mirror = mirrorIncident(incident);
  if (authority.authority === "unavailable") {
    return { ok: false, kind: "recordFailed", ...authority, mirror };
  }
  if (authority.authority === "session") {
    return mirror.ok
      ? { ok: true, kind: "recorded", ...authority, mirror }
      : { ok: false, kind: "recordFailed", ...authority, reason: "sessionWriteFailed", mirror };
  }
  try {
    GM_setValue(DiagnosticEvidenceKey.ENCOUNTER_GENERATION_INCIDENT, incident);
    return { ok: true, kind: "recorded", ...authority, mirror };
  } catch (error) {
    return {
      ok: false,
      kind: "recordFailed",
      ...authority,
      reason: "gmWriteFailed",
      error: errorText(error),
      mirror,
    };
  }
}

function recordIncident(event) {
  const { incident } = event;
  const authority = selectAuthority();
  const previous = readStoredIncident(authority);
  if (
    displayedIncidentIds.has(incident.id) ||
    (previous?.id === incident.id && previous.display?.status === "shown")
  ) {
    if (event.requiresShared && authority.scope !== "crossOrigin") {
      return {
        ok: false,
        kind: "recordFailed",
        ...authority,
        reason: "sharedAuthorityUnavailable",
        incident: previous || incident,
      };
    }
    displayedIncidentIds.add(incident.id);
    return { ok: true, kind: "alreadyActive", ...authority, incident: previous || incident };
  }
  const persistence = persistIncident(incident, authority);
  const sharedAccepted = !event.requiresShared || persistence.scope === "crossOrigin";
  return {
    ...persistence,
    ok: persistence.ok && sharedAccepted,
    kind: persistence.ok && sharedAccepted ? persistence.kind : "recordFailed",
    reason: persistence.ok && !sharedAccepted ? "sharedAuthorityUnavailable" : persistence.reason,
    incident,
  };
}

function markDisplayed(event) {
  if (event.status === "shown") displayedIncidentIds.add(event.incident.id);
  const incident = {
    ...event.incident,
    display: {
      status: event.status,
      error: event.error,
      displayedAt: Date.now(),
    },
  };
  return { ...persistIncident(incident, selectAuthority()), incident };
}

export function runEncounterGenerationIncident(event) {
  if (event?.type === EVENT_RECORD) return recordIncident(event);
  if (event?.type === EVENT_MARK_DISPLAYED) return markDisplayed(event);
  if (event?.type === EVENT_READ_ACTIVE) return readActiveIncident();
  if (event?.type === EVENT_CLEAR) return clearIncident(event);
  return undefined;
}
