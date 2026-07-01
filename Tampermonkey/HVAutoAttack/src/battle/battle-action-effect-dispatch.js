// 行动效果分发入口：把 PURE decide 的 ActionResult 翻译为 DOM/command 副作用。
// 返回 acted(boolean)：action decision 据此短路。深度 B 后已无 delegate 过渡桥——所有 step 的判断都在
// PURE decide 完成，本入口只翻译业务结果 → 副作用（含 isOn 写前探活）。
import { _alert } from "../core/lang.js";
import { BattleDefendCommandEvent, runBattleDefendCommand } from "./battle-defend-command.js";
import { BattleFleeCommandEvent, runBattleFleeCommand } from "./battle-flee-command.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";
import { BattleItemCommandEvent, runBattleItemCommand } from "./battle-item-command.js";
import { BattleSkillCommandEvent, runBattleSkillCommand } from "./battle-skill-command.js";
import { BattleTargetCommandEvent, runBattleTargetCommand } from "./battle-target-command.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "./battle-spirit-toggle.js";
import {
  BattlePreCastSpiritEvent,
  runBattlePreCastSpiritAutomation,
} from "./buff/activate-spirit.js";
import { BattleAttackExecutionEvent, runBattleAttackExecution } from "./attack/execute-attack.js";
import { BattleChannelExecutionEvent, runBattleChannelExecution } from "./buff/execute-channel.js";
import { BattleItemExecutionEvent, runBattleItemExecution } from "./item/execute-item.js";
import {
  CriticalBuffPauseExecutionEvent,
  runCriticalBuffPauseExecution,
} from "./critical-buff-guard/execute-critical-pause.js";
import {
  BattleActionEffectEvidenceEvent,
  runBattleActionEffectEvidence,
} from "./battle-action-effect-evidence.js";

const EVENT_APPLY_ACTION_RESULT = "applyActionResult";

export const BattleActionEffectDispatchEvent = Object.freeze({
  APPLY_ACTION_RESULT: EVENT_APPLY_ACTION_RESULT,
});

const battleActionEffectDispatchEventHandlers = Object.freeze({
  [EVENT_APPLY_ACTION_RESULT]: (event) => applyActionResult(event.result, event.snap),
});

const ACTION_RESULT_EXECUTORS = Object.freeze({
  noop: executeNoopResult,
  "item-command": executeItemCommandResult,
  "skill-command": executeSkillCommandResult,
  "defend-command": executeDefendCommandResult,
  "toggle-spirit": executeToggleSpiritResult,
  "click-skill-then-target": executeSkillTargetResult,
  "flee-command": executeFleeCommandResult,
  "alert-and-pause": executeAlertPauseResult,
  pause: executePauseResult,
  "critical-pause": executeCriticalPauseResult,
  "attack-plan": executeAttackPlanResult,
  "item-plan": executeItemPlanResult,
  "channel-plan": executeChannelPlanResult,
});

function applyActionResult(result, snap) {
  const acted = ACTION_RESULT_EXECUTORS[result?.kind]?.(result, snap) ?? false;
  runBattleActionEffectEvidence({
    type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
    result,
    acted,
    knownResultKind: Boolean(ACTION_RESULT_EXECUTORS[result?.kind]),
  });
  return acted;
}

function rejectUnknownActionEffectEvent(event) {
  runBattleActionEffectEvidence({
    type: BattleActionEffectEvidenceEvent.RECORD_APPLIED,
    result: { kind: "unknown-dispatch-event", reason: "unknownActionEffectDispatchEvent", eventType: event?.type ?? null },
    acted: false,
    failureReason: "unknownActionEffectDispatchEvent",
  });
  return false;
}

function executeNoopResult() {
  return false;
}

function executeItemCommandResult(result) {
  return !!runBattleItemCommand({
    type: BattleItemCommandEvent.CLICK_ITEM,
    itemId: result.itemId,
  });
}

function executeSkillCommandResult(result) {
  return !!runBattleSkillCommand({
    type: BattleSkillCommandEvent.CLICK_READY,
    skillId: result.skillId,
  });
}

function executeDefendCommandResult() {
  return !!runBattleDefendCommand({ type: BattleDefendCommandEvent.CLICK });
}

function executeToggleSpiritResult() {
  return !!runBattleSpiritToggleAutomation({
    type: BattleSpiritToggleEvent.CLICK_AND_RECORD,
  });
}

function executeSkillTargetResult(result) {
  // debuff/boss 双段：Spirit 前置（命中则本回合让出）再 skill→target 双击。
  if (
    runBattlePreCastSpiritAutomation({
      type: BattlePreCastSpiritEvent.ACTIVATE_IF_ALLOWED,
    })
  ) {
    return true;
  }
  return !!runBattleTargetCommand({
    type: BattleTargetCommandEvent.CLICK_SKILL_THEN_TARGET,
    skillId: result.skillId,
    targetId: result.targetId,
  });
}

function executeFleeCommandResult() {
  return !!runBattleFleeCommand({ type: BattleFleeCommandEvent.CLICK_AND_RELOAD });
}

function executeAlertPauseResult(result) {
  _alert(0, result.msg.l0, result.msg.l1, result.msg.l2);
  runBattlePauseAutomation({
    type: BattlePauseEvent.PAUSE,
    reason: "alertAndPause",
    detail: { resultKind: result.kind, msg: result.msg },
  });
  return true;
}

function executePauseResult() {
  // autoPause：纯暂停（无 alert），setValue disabled + 按钮文案
  runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE, reason: "autoPause" });
  return true;
}

function executeCriticalPauseResult(result) {
  // criticalBuffGuard 命中：告警 + 暂停（alarm/disabled/按钮/title）。
  return runCriticalBuffPauseExecution({
    type: CriticalBuffPauseExecutionEvent.APPLY_PLAN,
    plan: result,
  });
}

function executeAttackPlanResult(result, snap) {
  // attack PURE 决策产出 AttackPlan，attack execution 入口翻译为 click + 学习器/F4 记账。
  return runBattleAttackExecution({
    type: BattleAttackExecutionEvent.APPLY_PLAN,
    plan: result.plan,
    snap,
  });
}

function executeItemPlanResult(result, snap) {
  // 宝石/药水/stall/卷轴 PURE 决策产出 ItemPlan，item execution 入口探活+click+记账。
  return runBattleItemExecution({
    type: BattleItemExecutionEvent.APPLY_PLAN,
    plan: result.plan,
    snap,
  });
}

function executeChannelPlanResult(result) {
  // Channel 三段 PURE 决策产出 ChannelPlan，channel execution 入口探活+click。
  return runBattleChannelExecution({
    type: BattleChannelExecutionEvent.APPLY_PLAN,
    plan: result.plan,
  });
}

export function runBattleActionEffectDispatch(event = { type: EVENT_APPLY_ACTION_RESULT }) {
  return battleActionEffectDispatchEventHandlers[event?.type]?.(event) ?? rejectUnknownActionEffectEvent(event);
}
