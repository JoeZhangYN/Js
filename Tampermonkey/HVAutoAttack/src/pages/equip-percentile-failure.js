export const EQUIPMENT_PERCENTILE_FAILURE_KEY = "HVAA:lastEquipmentPercentileFailure";

function errorText(error) {
  return error?.message || error?.name || String(error || "unknown");
}

export function recordEquipmentPercentileFailure(stage, detail = {}) {
  const evidence = { capability: "equipmentPercentile", stage, detail };
  try {
    globalThis.sessionStorage?.setItem(EQUIPMENT_PERCENTILE_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Equipment percentile diagnostics must not block display toggles.
  }
  try {
    console.warn("[HVAA] equipment percentile failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistEquipmentPercentilePreference(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    recordEquipmentPercentileFailure("persist-preference", {
      key,
      value,
      error: errorText(error),
    });
    return false;
  }
}

export function recordEquipmentPercentilePreferenceReadFailure(key, error) {
  return recordEquipmentPercentileFailure("read-preference", { key, error: errorText(error) });
}
