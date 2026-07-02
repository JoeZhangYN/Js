export const ENCOUNTER_STATE_FAILURE_KEY = "HVAA:lastEncounterStateFailure";

function errorText(error) {
  return error?.message || error?.name || String(error || "unknown");
}

function safeDetail(detail) {
  try {
    JSON.stringify(detail);
    return detail;
  } catch (error) {
    return { unserializable: true, error: errorText(error) };
  }
}

export function recordEncounterStateFailure(stage, detail, deps = {}) {
  const storage = deps.sessionStorage || globalThis.sessionStorage;
  const warn = deps.warn || ((...args) => console.warn(...args));
  const evidence = {
    capability: "encounterState",
    source: "encounterState",
    stage,
    detail: safeDetail(detail),
  };
  try {
    storage?.setItem(ENCOUNTER_STATE_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Failure evidence must not break encounter state fallback.
  }
  try {
    warn("[HVAA] encounter state failed", { stage, detail });
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}
