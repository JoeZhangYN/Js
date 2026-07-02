import { STORAGE_KEYS } from "../state/persist-keys.js";
import { setValue } from "../state/storage.js";

export const CROSS_SITE_ENCOUNTER_FAILURE_KEY = "HVAA:lastCrossSiteEncounterFailure";

export function recordCrossSiteEncounterFailure(stage, failure) {
  const evidence = { capability: "crossSiteEncounter", stage, failure };
  try {
    sessionStorage.setItem(CROSS_SITE_ENCOUNTER_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Cross-site encounter failure evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] cross-site encounter failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistCrossSiteReturnOrigin(origin) {
  try {
    setValue(STORAGE_KEYS.URL, origin);
    return true;
  } catch (error) {
    recordCrossSiteEncounterFailure("persist-return-origin", {
      kind: "storageWrite",
      key: STORAGE_KEYS.URL,
      origin,
      error: error?.message || String(error),
    });
    return false;
  }
}
