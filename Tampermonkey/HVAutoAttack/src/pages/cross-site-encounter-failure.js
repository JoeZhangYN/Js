import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { setValue } from "../state/storage.js";

export const CROSS_SITE_ENCOUNTER_FAILURE_KEY = "HVAA:lastCrossSiteEncounterFailure";

export function recordCrossSiteEncounterFailure(stage, failure) {
  const evidence = { capability: "crossSiteEncounter", stage, failure };
  try {
    sessionStorage.setItem(CROSS_SITE_ENCOUNTER_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Cross-site encounter failure evidence is diagnostic only.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] cross-site encounter failed", evidence],
  });
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
