// pre-cast Spirit Stance：debuff 全员/单目标、Boss-Imperil 等"先选技能再点怪"前可选激活灵魂姿态。
// 从 buff.js 抽成叶子模块：打破 dispatch → buff → execute-buff → dispatch 的循环依赖
// （dispatch 只需 Spirit 前置这一点能力，不该被迫 import 整个 buff.js）。buff.js re-export 保持兼容。
import { OptionEvent, runOptionAutomation } from "../../state/option.js";
import { checkCondition } from "../../settings/condition-eval.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "../battle-spirit-toggle.js";

function readOptionField(key, fallback) {
  return runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback });
}

/**
 * 若开启 preCastSS 且条件满足且 Spirit 当前未激活 → click 激活。
 * 与 buff.js 原实现逐字等价（含无 snap 的 checkCondition DOM fallback）。
 * @returns {boolean} true = 已激活（调用方应让出本回合）
 */
export function checkAndActivateSpirit() {
  if (!readOptionField("preCastSS", false)) return false;
  if (!checkCondition(readOptionField("preCastSSCondition", ""))) return false;
  return !!runBattleSpiritToggleAutomation({
    type: BattleSpiritToggleEvent.ACTIVATE_IF_INACTIVE,
  });
}
