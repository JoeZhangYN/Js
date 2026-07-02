// 小马验证(riddle ML)运行日志：半持久化「滚动缓冲」。
// 动机（用户诉求 2026-06-06）：riddle 提交即重定向、console 日志即丢；单槽 lastError 只存最后一条、
// 翻不了历史。本模块在 GM 存储里维护一个环形缓冲（最近 CAP 条, 带时间戳），过页面跳转不丢、
// 面板可翻可清。日志文本建议英文/码键，跨语言稳定、便于事后比对。
// 叶子模块：只依赖 storage/failure（无环，可被 riddle-stats.js / riddle.js 同时 import）。
import { getValue } from "./storage.js";
import {
  RIDDLE_LOG_KEY,
  clearPersistedRiddleLog,
  persistRiddleLog,
} from "./riddle-log-failure.js";

const CAP = 80; // 环形上限：超出从头截断，恒只留最近 CAP 条。

const EVENT_PUSH = "push";
const EVENT_READ = "read";
const EVENT_CLEAR = "clear";
const EVENT_RENDER_REPORT_ROWS = "renderReportRows";

export const RiddleLogEvent = Object.freeze({
  PUSH: EVENT_PUSH,
  READ: EVENT_READ,
  CLEAR: EVENT_CLEAR,
  RENDER_REPORT_ROWS: EVENT_RENDER_REPORT_ROWS,
});

const riddleLogEventHandlers = {
  [EVENT_PUSH]: (event) => pushRiddleLog(event.message),
  [EVENT_READ]: getRiddleLog,
  [EVENT_CLEAR]: clearRiddleLog,
  [EVENT_RENDER_REPORT_ROWS]: renderRiddleLogReportRows,
};

/**
 * 追加一条日志：自动盖时间戳 + 环形截断到 CAP。空串忽略。
 * @param {string} msg 日志正文（>300 字截断；建议英文/码键）
 */
function pushRiddleLog(msg) {
  if (!msg) return;
  const arr = getValue(RIDDLE_LOG_KEY, true) || [];
  arr.push({ t: new Date().toLocaleTimeString(), m: String(msg).slice(0, 300) });
  if (arr.length > CAP) arr.splice(0, arr.length - CAP);
  return persistRiddleLog(arr);
}

/**
 * 读全部日志（旧→新）。缺失返空数组。
 * @returns {{t:string, m:string}[]}
 */
function getRiddleLog() {
  return getValue(RIDDLE_LOG_KEY, true) || [];
}

/** 清空日志。 */
function clearRiddleLog() {
  if (!clearPersistedRiddleLog()) return false;
  return getRiddleLog();
}

function escapeHtml(value) {
  return String(value).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderRiddleLogReportRows() {
  const log = getRiddleLog();
  if (!log.length) return "";
  const rows = log
    .slice()
    .reverse()
    .map((entry) => `<div>[${escapeHtml(entry.t)}] ${escapeHtml(entry.m)}</div>`)
    .join("");
  return (
    `<tr class="hvAATh"><td colspan="2"><l0>运行日志(最近${log.length})</l0><l1>運行日誌(最近${log.length})</l1><l2>Run log (last ${log.length})</l2></td></tr>` +
    `<tr><td colspan="2" style="text-align:left;"><div style="max-height:160px;overflow:auto;font:11px/1.5 monospace;word-break:break-all;">${rows}</div></td></tr>`
  );
}

export function runRiddleLogAutomation(event = { type: EVENT_READ }) {
  const handler = riddleLogEventHandlers[event?.type];
  return handler ? handler(event) : undefined;
}
