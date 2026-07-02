// 时间业务语义入口：禁止调用方用 time(0/1/2/3) 自行解释数字模式。

const EVENT_EPOCH_MS = "epochMs";
const EVENT_UTC_MONTH_DAY_LABEL = "utcMonthDayLabel";
const EVENT_UTC_DATE_KEY = "utcDateKey";
const EVENT_LOCAL_TIMESTAMP_LABEL = "localTimestampLabel";
const EVENT_LOCAL_FILE_TIMESTAMP = "localFileTimestamp";
const EVENT_ISO_TIMESTAMP = "isoTimestamp";
const EVENT_MS_UNTIL_NEXT_UTC_DAY = "msUntilNextUtcDay";

export const TimeEvent = Object.freeze({
  EPOCH_MS: EVENT_EPOCH_MS,
  UTC_MONTH_DAY_LABEL: EVENT_UTC_MONTH_DAY_LABEL,
  UTC_DATE_KEY: EVENT_UTC_DATE_KEY,
  LOCAL_TIMESTAMP_LABEL: EVENT_LOCAL_TIMESTAMP_LABEL,
  LOCAL_FILE_TIMESTAMP: EVENT_LOCAL_FILE_TIMESTAMP,
  ISO_TIMESTAMP: EVENT_ISO_TIMESTAMP,
  MS_UNTIL_NEXT_UTC_DAY: EVENT_MS_UNTIL_NEXT_UTC_DAY,
});

function msUntilNextUtcDay(stamp) {
  const date = new Date(stamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1) - stamp;
}

const timeEventHandlers = Object.freeze({
  [EVENT_EPOCH_MS]: ({ date }) => date.getTime(),
  [EVENT_MS_UNTIL_NEXT_UTC_DAY]: ({ date }) => msUntilNextUtcDay(date.getTime()),
  [EVENT_UTC_MONTH_DAY_LABEL]: ({ date }) => `${date.getUTCMonth() + 1}/${date.getUTCDate()}`,
  [EVENT_UTC_DATE_KEY]: ({ date }) =>
    `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`,
  [EVENT_LOCAL_TIMESTAMP_LABEL]: ({ date }) =>
    date.toLocaleString(navigator.language, { hour12: false }),
  [EVENT_LOCAL_FILE_TIMESTAMP]: ({ date, pad }) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(
      date.getHours()
    )}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`,
  [EVENT_ISO_TIMESTAMP]: ({ date }) => date.toISOString(),
});

export function runTimeAutomation(event = { type: EVENT_EPOCH_MS }) {
  const stamp = event?.stamp;
  const date = stamp !== undefined ? new Date(stamp) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return timeEventHandlers[event?.type]?.({ date, pad });
}
