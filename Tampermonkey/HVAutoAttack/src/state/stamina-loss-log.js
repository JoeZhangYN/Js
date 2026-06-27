import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { TimeEvent, runTimeAutomation } from "../core/time.js";

const EVENT_READ = "read";
const EVENT_RECORD = "record";
const EVENT_CLEAR = "clear";

export const StaminaLossLogEvent = Object.freeze({
  READ: EVENT_READ,
  RECORD: EVENT_RECORD,
  CLEAR: EVENT_CLEAR,
});

function readStaminaLossLog() {
  return getValue(STORAGE_KEYS.STAMINA_LOST_LOG, true) || {};
}

function recordStaminaLoss(
  amount,
  stamp = runTimeAutomation({ type: TimeEvent.LOCAL_TIMESTAMP_LABEL })
) {
  const log = readStaminaLossLog();
  log[stamp] = Number(amount) || 0;
  setValue(STORAGE_KEYS.STAMINA_LOST_LOG, log);
  return log;
}

function clearStaminaLossLog() {
  setValue(STORAGE_KEYS.STAMINA_LOST_LOG, {});
  return readStaminaLossLog();
}

export function runStaminaLossLogAutomation(event = { type: EVENT_READ }) {
  if (event.type === EVENT_READ) return readStaminaLossLog();
  if (event.type === EVENT_RECORD) return recordStaminaLoss(event.amount, event.stamp);
  if (event.type === EVENT_CLEAR) return clearStaminaLossLog();
  return undefined;
}
