const ALARM_AUDIO_PROFILES = Object.freeze([
  Object.freeze({ key: "Common", label: Object.freeze({ l01: "通用", l2: "Common" }) }),
  Object.freeze({ key: "Error", label: Object.freeze({ l0: "错误", l1: "錯誤", l2: "Error" }) }),
  Object.freeze({ key: "Defeat", label: Object.freeze({ l0: "失败", l1: "失敗", l2: "Defeat" }) }),
  Object.freeze({ key: "Riddle", label: Object.freeze({ l0: "答题", l1: "答題", l2: "Riddle" }) }),
  Object.freeze({
    key: "Victory",
    label: Object.freeze({ l0: "胜利", l1: "勝利", l2: "Victory" }),
  }),
]);

const ALARM_RUNTIME_KIND_KEYS = Object.freeze([
  ...ALARM_AUDIO_PROFILES.map(({ key }) => key),
  "Test",
]);

const EVENT_READ_AUDIO_PROFILES = "readAudioProfiles";
const EVENT_READ_RUNTIME_KIND_KEYS = "readRuntimeKindKeys";
const EVENT_NORMALIZE_KIND = "normalizeKind";

export const AlarmProfileEvent = Object.freeze({
  READ_AUDIO_PROFILES: EVENT_READ_AUDIO_PROFILES,
  READ_RUNTIME_KIND_KEYS: EVENT_READ_RUNTIME_KIND_KEYS,
  NORMALIZE_KIND: EVENT_NORMALIZE_KIND,
});

const alarmProfileEventHandlers = Object.freeze({
  [EVENT_READ_AUDIO_PROFILES]: () => ALARM_AUDIO_PROFILES,
  [EVENT_READ_RUNTIME_KIND_KEYS]: () => ALARM_RUNTIME_KIND_KEYS,
  [EVENT_NORMALIZE_KIND]: (event) =>
    ALARM_RUNTIME_KIND_KEYS.includes(event.kind) ? event.kind : "Common",
});

export function runAlarmProfileCatalog(event = { type: EVENT_READ_AUDIO_PROFILES }) {
  return alarmProfileEventHandlers[event?.type]?.(event);
}
