// SHELL: 把 decide-item 的 ItemPlan 翻译为 DOM 副作用 + 状态记账。
// 只写不判断（判断全在 decide-item.js）；isOn/gE 探活属写路径安全读（与原 item.js 一致）。
// 记账：autoTune 用药事件 / Spirit toggle cooldown / Focus command / recordPreDrink。
import { AutoTuneEvent, runAutoTuneAutomation } from "../../state/auto-tune.js";
import { BattleFocusCommandEvent, runBattleFocusCommand } from "../battle-focus-command.js";
import { BattleItemCommandEvent, runBattleItemCommand } from "../battle-item-command.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "../battle-spirit-toggle.js";
import {
  RecoveryLearningEvent,
  runRecoveryLearningAutomation,
} from "../../state/recovery-learner.js";

function recordAutoTunePotionUse() {
  runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_POTION_USE });
}

function recoveryAbs(snap) {
  return { hp: snap?.hpAbs, mp: snap?.mpAbs, sp: snap?.spAbs };
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
      // 原 useGem：decideGem 命中后 click gem + autoTune 计数
      runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_GEM });
      recordAutoTunePotionUse();
      return true;
    }

    case "potion": {
      // 原 deadSoon：按 candidates 顺序探活，第一个可用的喝（noWaste 时先 recordPreDrink）
      for (const id of plan.candidates) {
        const event = {
          type: BattleItemCommandEvent.CLICK_ITEM,
          itemId: id,
        };
        if (plan.noWaste) {
          event.beforeClick = () => {
            runRecoveryLearningAutomation({
              type: RecoveryLearningEvent.RECORD_PRE_DRINK,
              potionId: id,
              recoveryAbs: recoveryAbs(snap),
            });
          };
        }
        if (runBattleItemCommand(event)) {
          recordAutoTunePotionUse();
          return true;
        }
      }
      return false;
    }

    case "stall": {
      // 原 stallTopup tryFirst 链：第一个能落地的 attempt 生效，后续不再尝试
      for (const attempt of plan.attempts) {
        if (attempt.kind === "spirit-off") {
          if (
            runBattleSpiritToggleAutomation({
              type: BattleSpiritToggleEvent.CLICK_AND_RECORD,
            })
          ) {
            return true;
          }
          continue;
        }
        if (attempt.kind === "focus") {
          if (runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK })) return true;
          continue;
        }
        if (attempt.kind === "draught") {
          if (
            runBattleItemCommand({
              type: BattleItemCommandEvent.CLICK_ITEM,
              itemId: attempt.id,
              beforeClick: () => {
                runRecoveryLearningAutomation({
                  type: RecoveryLearningEvent.RECORD_PRE_DRINK,
                  potionId: attempt.id,
                  recoveryAbs: recoveryAbs(snap),
                });
              },
            })
          ) {
            return true;
          }
          continue;
        }
      }
      return false;
    }

    case "scroll": {
      // 原 useScroll：按 candidates 顺序探活，第一个存在的 click
      for (const id of plan.candidates) {
        if (runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_ITEM, itemId: id })) {
          return true;
        }
      }
      return false;
    }

    default:
      return false;
  }
}
