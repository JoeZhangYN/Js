import { _alert } from "../core/lang.js";
import { BattleAttackExecutionEvent, runBattleAttackExecution } from "./attack/execute-attack.js";
import { BattleDefendCommandEvent, runBattleDefendCommand } from "./battle-defend-command.js";
import { BattleFleeCommandEvent, runBattleFleeCommand } from "./battle-flee-command.js";
import { BattleItemCommandEvent, runBattleItemCommand } from "./battle-item-command.js";
import { BattleSkillCommandEvent, runBattleSkillCommand } from "./battle-skill-command.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "./battle-spirit-toggle.js";
import { BattleTargetCommandEvent, runBattleTargetCommand } from "./battle-target-command.js";
import {
  BattlePreCastSpiritEvent,
  runBattlePreCastSpiritAutomation,
} from "./buff/activate-spirit.js";
import { BattleChannelExecutionEvent, runBattleChannelExecution } from "./buff/execute-channel.js";
import {
  CriticalBuffPauseExecutionEvent,
  runCriticalBuffPauseExecution,
} from "./critical-buff-guard/execute-critical-pause.js";
import { BattleItemExecutionEvent, runBattleItemExecution } from "./item/execute-item.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";

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

export function isKnownActionResultKind(kind) {
  return Boolean(ACTION_RESULT_EXECUTORS[kind]);
}

export function executeActionResult(result, snap) {
  try {
    return {
      acted: Boolean(ACTION_RESULT_EXECUTORS[result?.kind]?.(result, snap) ?? false),
    };
  } catch (error) {
    return {
      acted: false,
      failureReason: "actionExecutorThrew",
      error: error?.message || String(error),
    };
  }
}

function executeNoopResult() {
  return false;
}

function executeItemCommandResult(result) {
  return !!runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_ITEM, itemId: result.itemId });
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
  return !!runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.CLICK_AND_RECORD });
}

function executeSkillTargetResult(result) {
  if (runBattlePreCastSpiritAutomation({ type: BattlePreCastSpiritEvent.ACTIVATE_IF_ALLOWED })) {
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
  return !!runBattlePauseAutomation({
    type: BattlePauseEvent.PAUSE,
    reason: "alertAndPause",
    detail: { resultKind: result.kind, msg: result.msg },
  });
}

function executePauseResult() {
  return !!runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE, reason: "autoPause" });
}

function executeCriticalPauseResult(result) {
  return runCriticalBuffPauseExecution({
    type: CriticalBuffPauseExecutionEvent.APPLY_PLAN,
    plan: result,
  });
}

function executeAttackPlanResult(result, snap) {
  return runBattleAttackExecution({
    type: BattleAttackExecutionEvent.APPLY_PLAN,
    plan: result.plan,
    snap,
  });
}

function executeItemPlanResult(result, snap) {
  return runBattleItemExecution({
    type: BattleItemExecutionEvent.APPLY_PLAN,
    plan: result.plan,
    snap,
  });
}

function executeChannelPlanResult(result) {
  return runBattleChannelExecution({
    type: BattleChannelExecutionEvent.APPLY_PLAN,
    plan: result.plan,
  });
}
