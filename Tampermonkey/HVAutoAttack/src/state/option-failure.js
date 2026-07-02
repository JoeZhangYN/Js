import { STORAGE_KEYS } from "./persist-keys.js";
import { delValue, setValue } from "./storage.js";

export const OPTION_FAILURE_KEY = "HVAA:lastOptionFailure";

export function recordOptionFailure(stage, error) {
  const evidence = {
    capability: "option",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(OPTION_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Option failure evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] option persistence failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistOption(option) {
  try {
    setValue(STORAGE_KEYS.OPTION, option);
    return true;
  } catch (error) {
    recordOptionFailure("write", error);
    return false;
  }
}

export function clearPersistedOption() {
  try {
    delValue(STORAGE_KEYS.OPTION);
    return true;
  } catch (error) {
    recordOptionFailure("clear", error);
    return false;
  }
}
