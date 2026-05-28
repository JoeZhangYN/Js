// HV 专属 DOM selector 字符串构造器（SSOT）。
// PURE：仅拼接 selector 字符串，不读 DOM。
// 供 PURE decide-* 构 ActionResult.selector 与 SHELL 构 gE 参数共用，
// 把 HV-specific selector 字面量收敛到一处（兑现 query.js 头注释的规划）。

/**
 * 物品栏（药水 / 卷轴 / 灌注等）按物品 id 定位的 selector。
 * 物品 div 的 onmouseover 内含其 id，用 `.bti3>div[onmouseover*="<id>"]` 子串匹配。
 * @param {string|number} id
 * @returns {string}
 */
export function itemSelector(id) {
  return `.bti3>div[onmouseover*="${id}"]`;
}
