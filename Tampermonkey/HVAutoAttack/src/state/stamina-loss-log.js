import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { time } from "../core/time.js";

export function readStaminaLossLog() {
  return getValue(STORAGE_KEYS.STAMINA_LOST_LOG, true) || {};
}

export function recordStaminaLoss(amount, stamp = time(3)) {
  const log = readStaminaLossLog();
  log[stamp] = Number(amount) || 0;
  setValue(STORAGE_KEYS.STAMINA_LOST_LOG, log);
  return log;
}

export function clearStaminaLossLog() {
  setValue(STORAGE_KEYS.STAMINA_LOST_LOG, {});
}
