// pre-cast Spirit Stance：debuff 全员/单目标、Boss-Imperil 等"先选技能再点怪"前可选激活灵魂姿态。
// 从 buff.js 抽成叶子模块：打破 dispatch → buff → execute-buff → dispatch 的循环依赖
// （dispatch 只需 Spirit 前置这一点能力，不该被迫 import 整个 buff.js）。buff.js re-export 保持兼容。
import { OptionEvent, runOptionAutomation } from "../../state/option.js";
import { checkCondition } from "../../settings/condition-eval.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "../battle-spirit-toggle.js";
import { recordBattleCommandResult } from "../battle-command-recording.js";

function readOptionField(key, fallback) {
  return runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback });
}

const EVENT_ACTIVATE_IF_ALLOWED = "activateIfAllowed";
const EVENT_UNKNOWN_PRE_CAST_SPIRIT = "unknownPreCastSpiritEvent";

export const BattlePreCastSpiritEvent = Object.freeze({
  ACTIVATE_IF_ALLOWED: EVENT_ACTIVATE_IF_ALLOWED,
});

const battlePreCastSpiritEventHandlers = Object.freeze({
  [EVENT_ACTIVATE_IF_ALLOWED]: () => activatePreCastSpiritIfAllowed(),
});

function recordRejectedPreCastSpirit(event) {
  recordBattleCommandResult("preCastSpirit.unknown", "rejected", EVENT_UNKNOWN_PRE_CAST_SPIRIT, {
    eventType: event?.type ?? null,
  });
  return false;
}

/**
 * 若开启 preCastSS 且条件满足且 Spirit 当前未激活 → click 激活。
 * 与 buff.js 原实现逐字等价（含无 snap 的 checkCondition DOM fallback）。
 * @returns {boolean} true = 已激活（调用方应让出本回合）
 */
function activatePreCastSpiritIfAllowed() {
  if (!readOptionField("preCastSS", false)) return false;
  if (!checkCondition(readOptionField("preCastSSCondition", ""))) return false;
  return preCastSpiritActivated(
    runBattleSpiritToggleAutomation({
      type: BattleSpiritToggleEvent.ACTIVATE_IF_INACTIVE,
    })
  );
}

function preCastSpiritActivated(result) {
  if (result?.kind === "failed") return false;
  return Boolean(result);
}

export function runBattlePreCastSpiritAutomation(event = { type: EVENT_ACTIVATE_IF_ALLOWED }) {
  return (
    battlePreCastSpiritEventHandlers[event?.type]?.(event) ?? recordRejectedPreCastSpirit(event)
  );
}
