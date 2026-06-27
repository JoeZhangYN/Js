// SHELL: 把 decideAttack 的 AttackPlan 翻译为 DOM 副作用 + 状态记账。
// 只写不判断（判断全在 decide-attack.js）；isOn 探活属写路径安全读（与原 attack 一致）。
// 记账：recordFire(CD) / skillOTOS(once-per-battle) / lastSpiritToggleGlobalTurn。
import { gE, isOn } from "../../dom/query.js";
import { g } from "../../state/store.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../../state/cd-tracker.js";
import { CdLearningEvent, runCdLearningAutomation } from "../../state/cd-learner.js";
import { recordBigSkillCast } from "../../state/big-skill-kill-learner.js";

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
      // 原 attack：直接 click 专注按钮（无 isOn，因 attack 是末步）
      gE("#ckey_focus")?.click();
      return true;

    case "toggle-spirit": {
      const el = gE("#ckey_spirit");
      if (!el) return false;
      el.click();
      g("lastSpiritToggleGlobalTurn", g("globalTurn") || 0);
      return true;
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
        const otos = g("skillOTOS") || {};
        otos[plan.code] = (otos[plan.code] || 0) + 1;
        g("skillOTOS", otos);
        gE(plan.skillId).click();
        runCdRuntimeAutomation({ type: CdRuntimeEvent.RECORD_FIRE, code: plan.code });
        runCdLearningAutomation({
          type: CdLearningEvent.RECORD_FIRE,
          code: plan.code,
          id: plan.skillId,
          snap,
        }); // F3：记开火 turn，供脱灰时收敛真实 CD
        recordBigSkillCast(plan.code, snap); // F4：OFC/FRD 记 pre-cast boss 态，下回合判是否秒杀
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
