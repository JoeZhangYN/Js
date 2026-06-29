// SHELL: 把 decideAttack 的 AttackPlan 翻译为 DOM 副作用 + 状态记账。
// 只写不判断（判断全在 decide-attack.js）；isOn 探活属写路径安全读（与原 attack 一致）。
// 记账：physical skill bookkeeping / Spirit toggle cooldown / Focus command。
import { gE, isOn } from "../../dom/query.js";
import {
  PhysicalSkillBookkeepingEvent,
  runPhysicalSkillBookkeeping,
} from "./physical-skill-bookkeeping.js";
import { BattleFocusCommandEvent, runBattleFocusCommand } from "../battle-focus-command.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "../battle-spirit-toggle.js";

/**
 * @param {import("../../core/types.js").AttackPlan} plan
 * @param {import("../../core/types.js").BattleSnapshot} [snap] 当前 turn 快照（学习器事件记账用）
 * @returns {boolean} acted —— 是否已触发副作用
 */
export function executeAttack(plan, snap) {
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
      if (isOn(plan.spellId)) gE(plan.spellId).click();
      gE(`#mkey_${plan.targetId}`)?.click();
      return true;
    }

    case "merciful-single": {
      if (isOn(plan.skillId)) gE(plan.skillId).click();
      gE(`#mkey_${plan.targetId}`)?.click();
      return true;
    }

    case "physical": {
      // isOn 探活通过才发技能 + 记账；merciful 斩杀点流血怪；末尾恒点默认首怪（原 attack 语义）
      if (isOn(plan.skillId)) {
        gE(plan.skillId).click();
        runPhysicalSkillBookkeeping({
          type: PhysicalSkillBookkeepingEvent.RECORD_FIRE,
          code: plan.code,
          skillId: plan.skillId,
          snap,
        });
        if (plan.mercifulTargetId != null) {
          gE(`#mkey_${plan.mercifulTargetId}`)?.click();
        }
      }
      gE(`#mkey_${plan.defaultTargetId}`)?.click();
      return true;
    }

    case "default":
      gE(`#mkey_${plan.targetId}`)?.click();
      return true;

    default:
      return false;
  }
}
