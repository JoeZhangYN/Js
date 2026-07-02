import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { TimeEvent, runTimeAutomation } from "../core/time.js";

const EVENT_READ = "read";
const EVENT_RECORD = "record";
const EVENT_CLEAR = "clear";
const EVENT_CLEAR_CONFIRMATION_MESSAGE = "clearConfirmationMessage";

export const StaminaLossLogEvent = Object.freeze({
  READ: EVENT_READ,
  RECORD: EVENT_RECORD,
  CLEAR: EVENT_CLEAR,
  CLEAR_CONFIRMATION_MESSAGE: EVENT_CLEAR_CONFIRMATION_MESSAGE,
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

function staminaLossClearConfirmationMessage() {
  const log = readStaminaLossLog();
  const rows = Object.entries(log)
    .map(([stamp, amount]) => `${stamp}: ${amount}`)
    .reverse();
  return `总共${rows.length}条记录 (There are ${rows.length} logs): \n${rows.join(
    "\n"
  )}\n是否重置 (Whether to reset)?`;
}

const staminaLossLogEventHandlers = Object.freeze({
  [EVENT_READ]: () => readStaminaLossLog(),
  [EVENT_RECORD]: (event) => recordStaminaLoss(event.amount, event.stamp),
  [EVENT_CLEAR]: () => clearStaminaLossLog(),
  [EVENT_CLEAR_CONFIRMATION_MESSAGE]: () => staminaLossClearConfirmationMessage(),
});

export function runStaminaLossLogAutomation(event = { type: EVENT_READ }) {
  return staminaLossLogEventHandlers[event?.type]?.(event);
}
