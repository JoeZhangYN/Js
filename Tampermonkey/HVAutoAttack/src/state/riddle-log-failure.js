import { delValue, setValue } from "./storage.js";

export const RIDDLE_LOG_KEY = "riddleLog";
export const RIDDLE_LOG_FAILURE_KEY = "HVAA:lastRiddleLogFailure";

export function recordRiddleLogFailure(stage, error) {
  const evidence = {
    capability: "riddleLog",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(RIDDLE_LOG_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Riddle log evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] riddle log persistence failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistRiddleLog(entries) {
  try {
    setValue(RIDDLE_LOG_KEY, entries);
    return true;
  } catch (error) {
    recordRiddleLogFailure("persist", error);
    return false;
  }
}

export function clearPersistedRiddleLog() {
  try {
    delValue(RIDDLE_LOG_KEY);
    return true;
  } catch (error) {
    recordRiddleLogFailure("clear", error);
    return false;
  }
}
