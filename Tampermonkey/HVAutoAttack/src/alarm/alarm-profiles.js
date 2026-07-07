export const ALARM_AUDIO_PROFILES = Object.freeze([
  Object.freeze({ key: "Common", label: Object.freeze({ l01: "通用", l2: "Common" }) }),
  Object.freeze({ key: "Error", label: Object.freeze({ l0: "错误", l1: "錯誤", l2: "Error" }) }),
  Object.freeze({ key: "Defeat", label: Object.freeze({ l0: "失败", l1: "失敗", l2: "Defeat" }) }),
  Object.freeze({ key: "Riddle", label: Object.freeze({ l0: "答题", l1: "答題", l2: "Riddle" }) }),
  Object.freeze({
    key: "Victory",
    label: Object.freeze({ l0: "胜利", l1: "勝利", l2: "Victory" }),
  }),
]);

export const ALARM_RUNTIME_KIND_KEYS = Object.freeze([
  ...ALARM_AUDIO_PROFILES.map(({ key }) => key),
  "Test",
]);
