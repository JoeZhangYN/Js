// 当前体力(stamina)读数收口（应抽尽抽 — 同形态字面量散落 4 处）。
//
// `gE("#stamina_readout .fc4.far>div").textContent.match(/\d+/)[0]*1` 同业务「读玩家当前体力数值」
// 散在 idle-arena(×2) / encounter / init，裸 `[0]` 元素缺失即崩。收口为防御解析：读不到/无数字 → 0（不崩）。
import { gE } from "../dom/query.js";

/**
 * 读玩家当前体力(stamina)数值。读不到 #stamina_readout 或无数字 → 0（不崩）。
 * @returns {number}
 */
export function readStaminaValue() {
  const el = gE("#stamina_readout .fc4.far>div");
  const m = el?.textContent?.match(/\d+/);
  return m ? Number(m[0]) : 0;
}
