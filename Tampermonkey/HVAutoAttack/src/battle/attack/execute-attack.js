// SHELL: 把 decideAttack 的 AttackPlan 翻译为 DOM 副作用 + 状态记账。
// 只写不判断（判断全在 decide-attack.js）；isOn 探活属写路径安全读（与原 attack 一致）。
// 记账：physical skill bookkeeping / Spirit toggle cooldown / Focus command。
import {
  PhysicalSkillBookkeepingEvent,
  runPhysicalSkillBookkeeping,
} from "./physical-skill-bookkeeping.js";
import { BattleFocusCommandEvent, runBattleFocusCommand } from "../battle-focus-command.js";
import { BattleTargetCommandEvent, runBattleTargetCommand } from "../battle-target-command.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "../battle-spirit-toggle.js";

const EVENT_APPLY_PLAN = "applyPlan";

export const BattleAttackExecutionEvent = Object.freeze({
  APPLY_PLAN: EVENT_APPLY_PLAN,
});

const battleAttackExecutionEventHandlers = Object.freeze({
  [EVENT_APPLY_PLAN]: (event) => applyAttackPlan(event.plan, event.snap),
});

const ATTACK_PLAN_EXECUTORS = Object.freeze({
  noop: executeNoopPlan,
  focus: executeFocusPlan,
  "toggle-spirit": executeToggleSpiritPlan,
  spell: executeSpellPlan,
  "merciful-single": executeMercifulSinglePlan,
  physical: executePhysicalPlan,
  default: executeDefaultPlan,
});

function observedBigSkillBosses(snap) {
  return (snap?.view || [])
    .filter((monster) => monster.isBoss && !monster.isDead && monster.monsterId != null)
    .map((monster) => ({
      mid: monster.monsterId,
      hpMax: monster.hpMax,
      imperilActive: (monster.buffs || []).includes("imperil"),
    }));
}

/**
 * @param {import("../../core/types.js").AttackPlan} plan
 * @param {import("../../core/types.js").BattleSnapshot} [snap] 当前 turn 快照（学习器事件记账用）
 */
function applyAttackPlan(plan, snap) {
  return ATTACK_PLAN_EXECUTORS[plan?.type]?.(plan, snap) ?? false;
}

function executeNoopPlan() {
  return false;
}

function executeFocusPlan() {
  return !!runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK });
}

function executeToggleSpiritPlan() {
  return !!runBattleSpiritToggleAutomation({
    type: BattleSpiritToggleEvent.CLICK_AND_RECORD,
  });
}

function executeSpellPlan(plan) {
  return !!runBattleTargetCommand({
    type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
    skillId: plan.spellId,
    targetId: plan.targetId,
  });
}

function executeMercifulSinglePlan(plan) {
  return !!runBattleTargetCommand({
    type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
    skillId: plan.skillId,
    targetId: plan.targetId,
  });
}

function executePhysicalPlan(plan, snap) {
  const targetId = plan.mercifulTargetId ?? plan.defaultTargetId;
  const event = {
    type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
    skillId: plan.skillId,
    targetId,
    afterSkillClick: () => recordPhysicalSkillFire(plan, snap),
  };
  if (plan.mercifulTargetId != null) event.targetRequiresSkill = true;
  const acted = !!runBattleTargetCommand(event);
  if (plan.mercifulTargetId != null) {
    runBattleTargetCommand({
      type: BattleTargetCommandEvent.CLICK_TARGET,
      targetId: plan.defaultTargetId,
    });
  }
  return acted;
}

function recordPhysicalSkillFire(plan, snap) {
  runPhysicalSkillBookkeeping({
    type: PhysicalSkillBookkeepingEvent.RECORD_FIRE,
    code: plan.code,
    skillId: plan.skillId,
    globalTurn: snap?.globalTurn,
    observedBosses: observedBigSkillBosses(snap),
  });
}

function executeDefaultPlan(plan) {
  return !!runBattleTargetCommand({
    type: BattleTargetCommandEvent.CLICK_TARGET,
    targetId: plan.targetId,
  });
}

export function runBattleAttackExecution(event = { type: EVENT_APPLY_PLAN }) {
  return battleAttackExecutionEventHandlers[event?.type]?.(event) ?? false;
}
