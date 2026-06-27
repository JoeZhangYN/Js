// 时间业务语义入口：禁止调用方用 time(0/1/2/3) 自行解释数字模式。

const EVENT_EPOCH_MS = "epochMs";
const EVENT_UTC_MONTH_DAY_LABEL = "utcMonthDayLabel";
const EVENT_UTC_DATE_KEY = "utcDateKey";
const EVENT_LOCAL_TIMESTAMP_LABEL = "localTimestampLabel";

export const TimeEvent = Object.freeze({
  EPOCH_MS: EVENT_EPOCH_MS,
  UTC_MONTH_DAY_LABEL: EVENT_UTC_MONTH_DAY_LABEL,
  UTC_DATE_KEY: EVENT_UTC_DATE_KEY,
  LOCAL_TIMESTAMP_LABEL: EVENT_LOCAL_TIMESTAMP_LABEL,
});

export function runTimeAutomation(event = { type: EVENT_EPOCH_MS }) {
  const stamp = event.stamp;
  const date = stamp ? new Date(stamp) : new Date();
  if (event.type === EVENT_EPOCH_MS) return date.getTime();
  if (event.type === EVENT_UTC_MONTH_DAY_LABEL)
    return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  if (event.type === EVENT_UTC_DATE_KEY) {
    return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  }
  if (event.type === EVENT_LOCAL_TIMESTAMP_LABEL) {
    return date.toLocaleString(navigator.language, { hour12: false });
  }
  return undefined;
}
