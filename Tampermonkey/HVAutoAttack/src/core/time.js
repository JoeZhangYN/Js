// 时间业务语义入口：禁止调用方用 time(0/1/2/3) 自行解释数字模式。

const EVENT_EPOCH_MS = "epochMs";
const EVENT_UTC_MONTH_DAY_LABEL = "utcMonthDayLabel";
const EVENT_UTC_DATE_KEY = "utcDateKey";
const EVENT_LOCAL_TIMESTAMP_LABEL = "localTimestampLabel";
const EVENT_LOCAL_FILE_TIMESTAMP = "localFileTimestamp";
const EVENT_ISO_TIMESTAMP = "isoTimestamp";

export const TimeEvent = Object.freeze({
  EPOCH_MS: EVENT_EPOCH_MS,
  UTC_MONTH_DAY_LABEL: EVENT_UTC_MONTH_DAY_LABEL,
  UTC_DATE_KEY: EVENT_UTC_DATE_KEY,
  LOCAL_TIMESTAMP_LABEL: EVENT_LOCAL_TIMESTAMP_LABEL,
  LOCAL_FILE_TIMESTAMP: EVENT_LOCAL_FILE_TIMESTAMP,
  ISO_TIMESTAMP: EVENT_ISO_TIMESTAMP,
});

export function runTimeAutomation(event = { type: EVENT_EPOCH_MS }) {
  const stamp = event.stamp;
  const date = stamp ? new Date(stamp) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  if (event.type === EVENT_EPOCH_MS) return date.getTime();
  if (event.type === EVENT_UTC_MONTH_DAY_LABEL)
    return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  if (event.type === EVENT_UTC_DATE_KEY) {
    return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  }
  if (event.type === EVENT_LOCAL_TIMESTAMP_LABEL) {
    return date.toLocaleString(navigator.language, { hour12: false });
  }
  if (event.type === EVENT_LOCAL_FILE_TIMESTAMP) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(
      date.getHours()
    )}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  }
  if (event.type === EVENT_ISO_TIMESTAMP) return date.toISOString();
  return undefined;
}
