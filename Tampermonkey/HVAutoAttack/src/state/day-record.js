// 每日记录日期同步能力：唯一拥有 dateNow 写入口；不持有下一战唤醒计时器。
import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { g } from "./store.js";

const EVENT_SYNC_UTC_DATE = "syncUtcDate";
export const DayRecordEvent = Object.freeze({
  SYNC_UTC_DATE: EVENT_SYNC_UTC_DATE,
});

function syncUtcDate() {
  const dateNow = runTimeAutomation({ type: TimeEvent.UTC_DATE_KEY });
  if (g("dateNow") !== dateNow) g("dateNow", dateNow);
  return dateNow;
}

const dayRecordEventHandlers = Object.freeze({
  [EVENT_SYNC_UTC_DATE]: () => syncUtcDate(),
});

export function runDayRecordAutomation(event = { type: EVENT_SYNC_UTC_DATE }) {
  return dayRecordEventHandlers[event?.type]?.(event);
}
