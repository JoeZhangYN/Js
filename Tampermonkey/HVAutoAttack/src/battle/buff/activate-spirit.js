// pre-cast Spirit Stance：debuff 全员/单目标、Boss-Imperil 等"先选技能再点怪"前可选激活灵魂姿态。
// 从 buff.js 抽成叶子模块：打破 dispatch → buff → execute-buff → dispatch 的循环依赖
// （dispatch 只需 Spirit 前置这一点能力，不该被迫 import 整个 buff.js）。buff.js re-export 保持兼容。
import { gE, isSpiritActive } from "../../dom/query.js";
import { g, tagEndToTrue } from "../../state/store.js";
import { checkCondition } from "../../settings/condition-eval.js";

/**
 * 若开启 preCastSS 且条件满足且 Spirit 当前未激活 → click 激活并 tagEnd。
 * 与 buff.js 原实现逐字等价（含无 snap 的 checkCondition DOM fallback）。
 * @returns {boolean} true = 已激活（调用方应让出本回合）
 */
export function checkAndActivateSpirit() {
  if (!g("option").preCastSS) return false;
  if (!checkCondition(g("option").preCastSSCondition)) return false;
  const spiritElement = gE("#ckey_spirit");
  if (!spiritElement) return false;
  if (isSpiritActive(spiritElement)) return false;
  spiritElement.click();
  tagEndToTrue();
  return true;
}
