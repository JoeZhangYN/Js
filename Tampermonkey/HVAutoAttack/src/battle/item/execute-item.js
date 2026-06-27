// SHELL: 把 decide-item 的 ItemPlan 翻译为 DOM 副作用 + 状态记账。
// 只写不判断（判断全在 decide-item.js）；isOn/gE 探活属写路径安全读（与原 item.js 一致）。
// 记账：autoTunePotionCount（autoTune 开时本回合用药计数）/ lastSpiritToggleGlobalTurn / recordPreDrink。
import { gE, isOn } from "../../dom/query.js";
import { itemSelector } from "../../dom/selectors.js";
import { OptionEvent, runOptionAutomation } from "../../state/option.js";
import { g } from "../../state/store.js";
import {
  RecoveryLearningEvent,
  runRecoveryLearningAutomation,
} from "../../state/recovery-learner.js";

function shouldCountAutoTunePotion() {
  return runOptionAutomation({ type: OptionEvent.READ_FIELD, key: "autoTune", fallback: false });
}

function recordAutoTunePotionUse() {
  if (shouldCountAutoTunePotion()) {
    g("autoTunePotionCount", (g("autoTunePotionCount") || 0) + 1);
  }
}

/**
 * @param {import("../../core/types.js").ItemPlan} plan
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {boolean} acted —— 是否已触发副作用
 */
export function executeItem(plan, snap) {
  switch (plan.type) {
    case "noop":
      return false;

    case "gem": {
      // 原 useGem：decideGem 命中后 click #ikey_p + autoTune 计数
      gE("#ikey_p")?.click();
      recordAutoTunePotionUse();
      return true;
    }

    case "potion": {
      // 原 deadSoon：按 candidates 顺序 isOn 探活，第一个可用的喝（noWaste 时先 recordPreDrink）
      for (const id of plan.candidates) {
        const el = isOn(id);
        if (!el) continue;
        if (plan.noWaste) {
          runRecoveryLearningAutomation({
            type: RecoveryLearningEvent.RECORD_PRE_DRINK,
            potionId: id,
            snap,
          });
        }
        el.click();
        recordAutoTunePotionUse();
        return true;
      }
      return false;
    }

    case "stall": {
      // 原 stallTopup tryFirst 链：第一个能落地的 attempt 生效，后续不再尝试
      for (const attempt of plan.attempts) {
        if (attempt.kind === "spirit-off") {
          const el = gE("#ckey_spirit");
          if (!el) continue;
          el.click();
          g("lastSpiritToggleGlobalTurn", g("globalTurn") || 0);
          return true;
        }
        if (attempt.kind === "focus") {
          const el = gE("#ckey_focus");
          if (!el) continue;
          el.click();
          return true;
        }
        if (attempt.kind === "draught") {
          const el = gE(itemSelector(attempt.id));
          if (!el) continue;
          runRecoveryLearningAutomation({
            type: RecoveryLearningEvent.RECORD_PRE_DRINK,
            potionId: attempt.id,
            snap,
          });
          el.click();
          return true;
        }
      }
      return false;
    }

    case "scroll": {
      // 原 useScroll：按 candidates 顺序 gE 探活，第一个存在的 click
      for (const id of plan.candidates) {
        const el = gE(itemSelector(id));
        if (!el) continue;
        el.click();
        return true;
      }
      return false;
    }

    default:
      return false;
  }
}
