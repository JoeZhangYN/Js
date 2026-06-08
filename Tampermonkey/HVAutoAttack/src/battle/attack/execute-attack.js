// SHELL: 把 decideAttack 的 AttackPlan 翻译为 DOM 副作用 + 状态记账。
// 只写不判断（判断全在 decide-attack.js）；isOn 探活属写路径安全读（与原 attack 一致）。
// 记账：recordFire(CD) / skillOTOS(once-per-battle) / lastSpiritToggleGlobalTurn。
import { gE, isOn } from "../../dom/query.js";
import { g, tagEndToTrue } from "../../state/store.js";
import { recordFire } from "../../state/cd-tracker.js";

/**
 * @param {import("../../core/types.js").AttackPlan} plan
 * @returns {boolean} acted —— 是否已触发副作用
 */
export function executeAttack(plan) {
  switch (plan.type) {
    case "noop":
      return false;

    case "focus":
      // 原 attack：直接 click 专注按钮（无 isOn / 无 tagEnd，因 attack 是末步）
      gE("#ckey_focus")?.click();
      return true;

    case "toggle-spirit": {
      const el = gE("#ckey_spirit");
      if (!el) return false;
      el.click();
      g("lastSpiritToggleGlobalTurn", g("globalTurn") || 0);
      tagEndToTrue();
      return true;
    }

    case "spell": {
      // 原：isOn(spell) 探活后 click spell + click target；CD 漂移则退化为普攻该 target
      if (isOn(plan.spellId)) gE(plan.spellId).click();
      gE(`#mkey_${plan.targetId}`)?.click();
      tagEndToTrue();
      return true;
    }

    case "merciful-single": {
      if (isOn(plan.skillId)) gE(plan.skillId).click();
      gE(`#mkey_${plan.targetId}`)?.click();
      tagEndToTrue();
      return true;
    }

    case "physical": {
      // isOn 探活通过才发技能 + 记账；merciful 斩杀点流血怪；末尾恒点默认首怪（原 attack 语义）
      if (isOn(plan.skillId)) {
        const otos = g("skillOTOS") || {};
        otos[plan.code] = (otos[plan.code] || 0) + 1;
        g("skillOTOS", otos);
        gE(plan.skillId).click();
        recordFire(plan.code);
        if (plan.mercifulTargetId != null) {
          gE(`#mkey_${plan.mercifulTargetId}`)?.click();
        }
      }
      gE(`#mkey_${plan.defaultTargetId}`)?.click();
      tagEndToTrue();
      return true;
    }

    case "default":
      gE(`#mkey_${plan.targetId}`)?.click();
      tagEndToTrue();
      return true;

    default:
      return false;
  }
}
