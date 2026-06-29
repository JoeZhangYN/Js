// 唯一 SHELL（Phase 5b 编排倒置 + 深度 B）：把 PURE decide 的 ActionResult 翻译为 DOM 副作用。
// 复用 attempt-click / navigate / lang / pause-automation / activate-spirit + 各 step 的 execute-*。
// 返回 acted(boolean)：runRules 据此短路。深度 B 后已无 delegate 过渡桥——所有 step 的判断都在
// PURE decide 完成，dispatch 只翻译数据 → 副作用（含 isOn 写前探活）。
import { gE } from "../dom/query.js";
import { attemptClick } from "../dom/attempt-click.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { _alert } from "../core/lang.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";
import { BattleItemCommandEvent, runBattleItemCommand } from "./battle-item-command.js";
import { BattleSkillCommandEvent, runBattleSkillCommand } from "./battle-skill-command.js";
import { BattleTargetCommandEvent, runBattleTargetCommand } from "./battle-target-command.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "./battle-spirit-toggle.js";
import { checkAndActivateSpirit } from "./buff/activate-spirit.js";
import { executeAttack } from "./attack/execute-attack.js";
import { executeChannel } from "./buff/execute-channel.js";
import { executeItem } from "./item/execute-item.js";
import { executeCriticalPause } from "./critical-buff-guard/decide-critical-buff.js";

/**
 * 执行一个 ActionResult，返回是否已触发副作用。
 * @param {import("../core/types.js").ActionResult} result
 * @param {import("../core/types.js").BattleSnapshot} snap 当前 turn 快照（execute-* 记账用，如 recordPreDrink）
 * @returns {boolean} acted —— 已触发副作用（主循环据此停止后续 rule）
 */
export function dispatch(result, snap) {
  switch (result.kind) {
    case "noop":
      return false;

    case "click":
      // attemptClick 内含 isOn 探活 + click，失败（按钮禁用/缺失）返 false → 后续 rule 接管
      return attemptClick(result.selector);

    case "item-command":
      return !!runBattleItemCommand({
        type: BattleItemCommandEvent.CLICK_ITEM,
        itemId: result.itemId,
      });

    case "skill-command":
      return !!runBattleSkillCommand({
        type: BattleSkillCommandEvent.CLICK_READY,
        skillId: result.skillId,
      });

    case "toggle-spirit":
      return !!runBattleSpiritToggleAutomation({
        type: BattleSpiritToggleEvent.CLICK_AND_RECORD,
      });

    case "click-skill-then-target":
      // debuff/boss 双段：Spirit 前置（命中则本回合让出）再 skill→target 双击。
      if (checkAndActivateSpirit()) return true;
      return !!runBattleTargetCommand({
        type: BattleTargetCommandEvent.CLICK_SKILL_THEN_TARGET,
        skillId: result.skillId,
        targetId: result.targetId,
      });

    case "click-then-reload": {
      // flee：逃跑按钮 click + 延时 reload（逃跑按钮恒可点，无需 isOn 探活）
      const el = gE(result.selector);
      if (!el) return false;
      el.click();
      runNavigationAutomation({
        type: NavigationEvent.SCHEDULE_RELOAD,
        seconds: result.delaySec,
      });
      return true;
    }

    case "alert-and-pause":
      _alert(0, result.msg.l0, result.msg.l1, result.msg.l2);
      runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE });
      return true;

    case "pause":
      // autoPause：纯暂停（无 alert），setValue disabled + 按钮文案
      runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE });
      return true;

    case "critical-pause":
      // criticalBuffGuard 命中：告警 + 暂停（alarm/disabled/按钮/title），副作用在 executeCriticalPause
      executeCriticalPause(result);
      return true;

    case "halt":
      return true;

    case "attack-plan":
      // attack PURE 决策产出 AttackPlan，executeAttack 翻译为 click + 学习器/F4 记账。
      return executeAttack(result.plan, snap);

    case "item-plan":
      // 宝石/药水/stall/卷轴 PURE 决策产出 ItemPlan，executeItem 探活+click+记账（需 snap 做 recordPreDrink）。
      return executeItem(result.plan, snap);

    case "channel-plan":
      // Channel 三段 PURE 决策产出 ChannelPlan，executeChannel 探活+click。
      return executeChannel(result.plan);

    default:
      return false;
  }
}
