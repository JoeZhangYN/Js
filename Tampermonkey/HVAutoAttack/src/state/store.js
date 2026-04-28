// 全局运行时状态读写器（闭包对象 g() 的搬迁版）。
// 行为对齐原 g(key, value)：无参 → 整个 namespace；只 key → 读；key+value → 写。
// Phase 5 将重新设计为 Store 类（snapshot / typed keys），当前保留同名 API。
import { isIsekai, hvAAOriginal, hvAAIsekai } from "../env.js";

/**
 * 获取或设置全局运行时变量。
 * @param {string=} key
 * @param {*=} value
 * @returns {*} 读模式返值；无 key 返整个 namespace 对象
 * @example
 *   g("end")          // 读
 *   g("end", true)    // 写
 *   g()               // 整个 namespace
 */
export function g(key, value) {
  const hvAA = isIsekai ? hvAAIsekai : hvAAOriginal;
  if (key === undefined && value === undefined) return hvAA;
  if (value === undefined) return hvAA[key];
  hvAA[key] = value;
}

/** 标记当前主循环步骤已结束。Phase 5 会换成 ActionResult discriminated union。 */
export function tagEndToTrue() {
  g("end", true);
}
