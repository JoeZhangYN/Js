import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";
import { StaminaLossStoreEvent, runStaminaLossStoreAutomation } from "./stamina-loss-store.js";

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

async function readStaminaLossLog() {
  const rows = await runStaminaLossStoreAutomation({ type: StaminaLossStoreEvent.LIST });
  return Object.fromEntries((rows || []).map(({ stamp, amount }) => [stamp, amount]));
}

async function recordStaminaLoss(
  amount,
  stamp = runTimeAutomation({ type: TimeEvent.LOCAL_TIMESTAMP_LABEL })
) {
  const result = await runStaminaLossStoreAutomation({
    type: StaminaLossStoreEvent.APPEND,
    amount,
    stamp,
  });
  if (result?.outcome === StorageWriteOutcome.FAILED) return false;
  return readStaminaLossLog();
}

async function clearStaminaLossLog() {
  const result = await runStaminaLossStoreAutomation({ type: StaminaLossStoreEvent.CLEAR });
  if (result?.outcome === StorageWriteOutcome.FAILED) return false;
  return {};
}

async function staminaLossClearConfirmationMessage() {
  const log = await readStaminaLossLog();
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
