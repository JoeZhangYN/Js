// 小马验证(riddle ML)运行日志：半持久化「滚动缓冲」。
// 动机（用户诉求 2026-06-06）：riddle 提交即重定向、console 日志即丢；单槽 lastError 只存最后一条、
// 翻不了历史。本模块在 GM 存储里维护一个环形缓冲（最近 CAP 条, 带时间戳），过页面跳转不丢、
// 面板可翻可清。日志文本建议英文/码键，跨语言稳定、便于事后比对。
// 叶子模块：只依赖 storage.js（无环，可被 riddle-stats.js / riddle.js 同时 import）。
import { getValue, setValue, delValue } from "./storage.js";

const KEY = "riddleLog";
const CAP = 80; // 环形上限：超出从头截断，恒只留最近 CAP 条。

/**
 * 追加一条日志：自动盖时间戳 + 环形截断到 CAP。空串忽略。
 * @param {string} msg 日志正文（>300 字截断；建议英文/码键）
 */
export function pushRiddleLog(msg) {
  if (!msg) return;
  const arr = getValue(KEY, true) || [];
  arr.push({ t: new Date().toLocaleTimeString(), m: String(msg).slice(0, 300) });
  if (arr.length > CAP) arr.splice(0, arr.length - CAP);
  setValue(KEY, arr);
}

/**
 * 读全部日志（旧→新）。缺失返空数组。
 * @returns {{t:string, m:string}[]}
 */
export function getRiddleLog() {
  return getValue(KEY, true) || [];
}

/** 清空日志。 */
export function clearRiddleLog() {
  delValue(KEY);
}
