// 小马验证（riddle ML）统计内核。
// 三计数：小马图出现次数(appear, 每次 riddleAlert) / ML 调用次数(mlCall, 实际 POST) / ML 成功次数(mlOk, 返可用答案)。
// 成功率 = mlOk / mlCall。存储走 state/storage.js（带 prefix），与掉落/数据记录面板同机制；
// 面板在 settings/render.js「小马验证」tab 展示，重置走 resetRiddleStats。
// 叶子模块：只依赖 storage.js（无环，可被 riddle.js / riddle-ml.js 同时 import）。
import { getValue, setValue, delValue } from "./storage.js";

const KEY = "riddleStats";

/**
 * @typedef {object} RiddleStats
 * @property {number} appear 小马图（谜题页）出现次数
 * @property {number} mlCall ML 实际发起识别（POST）次数
 * @property {number} mlOk   ML 成功返回可用答案次数
 */

/**
 * 读当前统计（缺字段补 0，兼容旧存档 / 首次）。
 * @returns {RiddleStats}
 */
export function getRiddleStats() {
  const s = getValue(KEY, true) || {};
  return { appear: s.appear || 0, mlCall: s.mlCall || 0, mlOk: s.mlOk || 0 };
}

/** 小马图出现一次（riddle.js riddleAlert 调用，与 ML 是否开启/成功无关）。 */
export function recordRiddleAppear() {
  const s = getRiddleStats();
  s.appear += 1;
  setValue(KEY, s);
}

/**
 * ML 完成一次识别（POST 返回后调用）：mlCall +1；成功（返可用答案）再 mlOk +1。单次写入。
 * @param {boolean} ok ML 是否返回可用答案
 */
export function recordMLResult(ok) {
  const s = getRiddleStats();
  s.mlCall += 1;
  if (ok) s.mlOk += 1;
  setValue(KEY, s);
}

/** 重置全部统计。 */
export function resetRiddleStats() {
  delValue(KEY);
}
