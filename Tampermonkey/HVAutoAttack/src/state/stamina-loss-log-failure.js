import { STORAGE_KEYS } from "./persist-keys.js";
import { setValue } from "./storage.js";

export const STAMINA_LOSS_LOG_FAILURE_KEY = "HVAA:lastStaminaLossLogFailure";

export function recordStaminaLossLogFailure(stage, error) {
  const evidence = {
    capability: "staminaLossLog",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(STAMINA_LOSS_LOG_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Stamina loss log evidence is diagnostic only.
  }
  try {
    console.warn("[HVAA] stamina loss log persistence failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

export function persistStaminaLossLog(log, stage) {
  try {
    setValue(STORAGE_KEYS.STAMINA_LOST_LOG, log);
    return true;
  } catch (error) {
    recordStaminaLossLogFailure(stage, error);
    return false;
  }
}
