// option 字段统一读取层（5 大铁律 §1e 应抽未抽 — `g("option")?.xxx !== false` ≥ 10 处真重复）。
//
// 解决两个问题：
// 1. 早期 page hook（init.js 在 g("option") 装填前要读 forgeCostShow / equipPercentileMode）
//    → 需要 fallback 到 getValue("option", true)
// 2. defaultOn 字段（schema 里 defaultOn: true 的）原始 option 缺字段时也算启用
//    → 散落写法 `g("option")?.xxx !== false` 易写漏 ?. / 易把 undefined 当 false
//
// 同形态同失败模式 → 抽 helper 防退化。
import { g } from "./store.js";
import { getValue } from "./storage.js";

/**
 * 读 option 字段值：g("option") 优先（已装填），缺则 fallback 到 GM_setValue 直读，再缺返 fallback。
 * @param {string} key option 键名
 * @param {*=} fallback 字段未设时的默认值
 * @returns {*} option[key]，或 fallback
 */
export function getOption(key, fallback) {
  const opt = g("option") || getValue("option", true) || {};
  return opt[key] !== undefined ? opt[key] : fallback;
}

/**
 * defaultOn 风格 bool 字段是否启用（schema 默认开启，除非用户显式关）。
 * 等价于 `g("option")?.xxx !== false` 但带 fallback 处理 + 早期未装填兼容。
 * @param {string} key
 */
export function isOptionOn(key) {
  return getOption(key, true) !== false;
}
