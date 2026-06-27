// 每日记录日期同步能力：唯一拥有 dateNow 写入口。
import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { g } from "./store.js";

const EVENT_SYNC_UTC_DATE = "syncUtcDate";
const EVENT_REFRESH_AND_SCHEDULE_NEXT_UTC_DAY = "refreshAndScheduleNextUtcDay";
const UTC_DAY_ROLLOVER_GRACE_MS = 5000;

let scheduledDayRollover = undefined;

export const DayRecordEvent = Object.freeze({
  SYNC_UTC_DATE: EVENT_SYNC_UTC_DATE,
  REFRESH_AND_SCHEDULE_NEXT_UTC_DAY: EVENT_REFRESH_AND_SCHEDULE_NEXT_UTC_DAY,
});

function syncUtcDate() {
  const dateNow = runTimeAutomation({ type: TimeEvent.UTC_DATE_KEY });
  if (g("dateNow") !== dateNow) g("dateNow", dateNow);
  return dateNow;
}

function msUntilNextUtcDay(nowMs) {
  const now = new Date(nowMs);
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - nowMs;
}

function clearScheduledDayRollover(cancel) {
  if (scheduledDayRollover !== undefined) cancel(scheduledDayRollover);
  scheduledDayRollover = undefined;
}

function refreshAndScheduleNextUtcDay(event) {
  const deps = {
    cancel: event.cancel || clearTimeout,
    schedule: event.schedule || setTimeout,
    nowMs: event.nowMs ?? runTimeAutomation({ type: TimeEvent.EPOCH_MS }),
  };
  const dateNow = syncUtcDate();
  clearScheduledDayRollover(deps.cancel);
  if (typeof event.rerun !== "function") return dateNow;
  scheduledDayRollover = deps.schedule(
    () => {
      scheduledDayRollover = undefined;
      event.rerun();
    },
    msUntilNextUtcDay(deps.nowMs) + UTC_DAY_ROLLOVER_GRACE_MS
  );
  return dateNow;
}

export function runDayRecordAutomation(event = { type: EVENT_SYNC_UTC_DATE }) {
  if (event.type === EVENT_SYNC_UTC_DATE) return syncUtcDate();
  if (event.type === EVENT_REFRESH_AND_SCHEDULE_NEXT_UTC_DAY)
    return refreshAndScheduleNextUtcDay(event);
  return undefined;
}
