// 小马验证（riddle ML）统计内核。
// 计数：appear(小马图出现, 每次 riddleAlert) + outcomes(每次 ML 识别的结局分类, 见 ML_OUTCOMES)。
// ML 调用次数 = outcomes 各项之和；ML 成功次数 = outcomes.ok；成功率 = ok / 调用次数。
// 把"为什么失败"也量化进面板（统计的意义）：超时/限流/网络/无答案码… 各自单列。
// 存储走 state/storage.js（带 prefix），与掉落/数据记录面板同机制；面板在 settings/render.js「小马验证」tab 展示。
// 叶子模块：只依赖 storage.js（无环，可被 riddle.js / riddle-ml.js 同时 import）。
import { getValue, setValue, delValue } from "./storage.js";

const KEY = "riddleStats";

/**
 * ML 识别结局分类（与 riddle-ml.js tryMLAnswer 各终止分支一一对应）。
 * 顺序即面板展示顺序；ok 为成功，其余为失败原因（均走随机兜底）。
 */
export const ML_OUTCOMES = {
  ok: { l0: "成功", l1: "成功", l2: "Success" },
  onerror: { l0: "网络/CORS 错误", l1: "網絡/CORS 錯誤", l2: "Network/CORS error" },
  timeout: { l0: "超时(>12s)", l1: "超時(>12s)", l2: "Timeout(>12s)" },
  rate_limited: { l0: "限流(429)", l1: "限流(429)", l2: "Rate limited(429)" },
  non_json: { l0: "响应非 JSON", l1: "響應非 JSON", l2: "Non-JSON response" },
  no_answer_code: { l0: "无可识别答案码", l1: "無可識別答案碼", l2: "No answer code" },
  finish: { l0: "当日额度用尽", l1: "當日額度用盡", l2: "Daily quota reached" },
  server_error: { l0: "服务错误/许可", l1: "服務錯誤/許可", l2: "Server/license error" },
  unknown: { l0: "未知返回", l1: "未知返回", l2: "Unknown return" },
  no_image: { l0: "找不到图片", l1: "找不到圖片", l2: "No image" },
  empty_blob: { l0: "图片为空", l1: "圖片為空", l2: "Empty image" },
  exception: { l0: "脚本异常", l1: "腳本異常", l2: "Script exception" },
};

/**
 * 读统计并派生汇总。outcomes 补全所有分类为 0（兼容旧存档 / 首次）。
 * @returns {{appear:number, mlCall:number, ok:number, outcomes:Record<string,number>}}
 */
export function getRiddleStats() {
  const s = getValue(KEY, true) || {};
  const outcomes = {};
  for (const k of Object.keys(ML_OUTCOMES)) {
    outcomes[k] = (s.outcomes && s.outcomes[k]) || 0;
  }
  const mlCall = Object.values(outcomes).reduce((a, b) => a + b, 0);
  return { appear: s.appear || 0, mlCall, ok: outcomes.ok, outcomes };
}

/** 小马图出现一次（riddle.js riddleAlert 调用，与 ML 是否开启/成功无关）。 */
export function recordRiddleAppear() {
  const s = getValue(KEY, true) || {};
  s.appear = (s.appear || 0) + 1;
  setValue(KEY, s);
}

/**
 * 记录一次 ML 识别结局（成功 ok 或某失败原因）。未知分类归 unknown。单次写入。
 * @param {keyof ML_OUTCOMES | string} outcome
 */
export function recordMLOutcome(outcome) {
  const key = outcome in ML_OUTCOMES ? outcome : "unknown";
  const s = getValue(KEY, true) || {};
  if (!s.outcomes) s.outcomes = {};
  s.outcomes[key] = (s.outcomes[key] || 0) + 1;
  setValue(KEY, s);
}

/** 重置全部统计。 */
export function resetRiddleStats() {
  delValue(KEY);
}
