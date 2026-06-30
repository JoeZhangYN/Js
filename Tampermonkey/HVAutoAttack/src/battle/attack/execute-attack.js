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
  switch (plan.type) {
    case "noop":
      return false;

    case "focus":
      // 原 attack：Focus 是末步，即使按钮缺失也消耗本次 attack 分支。
      runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK });
      return true;

    case "toggle-spirit": {
      return !!runBattleSpiritToggleAutomation({
        type: BattleSpiritToggleEvent.CLICK_AND_RECORD,
      });
    }

    case "spell": {
      // 原：isOn(spell) 探活后 click spell + click target；CD 漂移则退化为普攻该 target
      runBattleTargetCommand({
        type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
        skillId: plan.spellId,
        targetId: plan.targetId,
      });
      return true;
    }

    case "merciful-single": {
      runBattleTargetCommand({
        type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
        skillId: plan.skillId,
        targetId: plan.targetId,
      });
      return true;
    }

    case "physical": {
      // isOn 探活通过才发技能 + 记账；merciful 斩杀点流血怪；末尾恒点默认首怪（原 attack 语义）
      if (plan.mercifulTargetId != null) {
        runBattleTargetCommand({
          type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
          skillId: plan.skillId,
          targetId: plan.mercifulTargetId,
          targetRequiresSkill: true,
          afterSkillClick: () => {
            runPhysicalSkillBookkeeping({
              type: PhysicalSkillBookkeepingEvent.RECORD_FIRE,
              code: plan.code,
              skillId: plan.skillId,
              globalTurn: snap?.globalTurn,
              observedBosses: observedBigSkillBosses(snap),
            });
          },
        });
      } else {
        runBattleTargetCommand({
          type: BattleTargetCommandEvent.TRY_SKILL_THEN_TARGET,
          skillId: plan.skillId,
          targetId: plan.defaultTargetId,
          afterSkillClick: () => {
            runPhysicalSkillBookkeeping({
              type: PhysicalSkillBookkeepingEvent.RECORD_FIRE,
              code: plan.code,
              skillId: plan.skillId,
              globalTurn: snap?.globalTurn,
              observedBosses: observedBigSkillBosses(snap),
            });
          },
        });
      }
      if (plan.mercifulTargetId != null) {
        runBattleTargetCommand({
          type: BattleTargetCommandEvent.CLICK_TARGET,
          targetId: plan.defaultTargetId,
        });
      }
      return true;
    }

    case "default":
      runBattleTargetCommand({
        type: BattleTargetCommandEvent.CLICK_TARGET,
        targetId: plan.targetId,
      });
      return true;

    default:
      return false;
  }
}

export function runBattleAttackExecution(event = { type: EVENT_APPLY_PLAN }) {
  return battleAttackExecutionEventHandlers[event.type]?.(event) ?? false;
}
