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

const EVENT_APPLY_PLAN = "applyPlan";

export const BattleItemExecutionEvent = Object.freeze({
  APPLY_PLAN: EVENT_APPLY_PLAN,
});

const battleItemExecutionEventHandlers = Object.freeze({
  [EVENT_APPLY_PLAN]: (event) => applyItemPlan(event.plan, event.snap),
});

const ITEM_PLAN_EXECUTORS = Object.freeze({
  noop: executeNoopPlan,
  gem: executeGemPlan,
  potion: executePotionPlan,
  stall: executeStallPlan,
  scroll: executeScrollPlan,
});

const STALL_ATTEMPT_EXECUTORS = Object.freeze({
  "spirit-off": executeStallSpiritOffAttempt,
  focus: executeStallFocusAttempt,
  draught: executeStallDraughtAttempt,
});

function recordAutoTunePotionUse() {
  runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_POTION_USE });
}

function recoveryAbs(snap) {
  return { hp: snap?.hpAbs, mp: snap?.mpAbs, sp: snap?.spAbs };
}

/**
 * @param {import("../../core/types.js").ItemPlan} plan
 * @param {import("../../core/types.js").BattleSnapshot} snap
 */
function applyItemPlan(plan, snap) {
  return ITEM_PLAN_EXECUTORS[plan?.type]?.(plan, snap) ?? false;
}

function executeNoopPlan() {
  return false;
}

function executeGemPlan() {
  if (!runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_GEM })) return false;
  recordAutoTunePotionUse();
  return true;
}

function executePotionPlan(plan, snap) {
  for (const id of plan.candidates) {
    if (tryPotionCandidate(id, plan.noWaste, snap)) return true;
  }
  return false;
}

function tryPotionCandidate(id, noWaste, snap) {
  const event = {
    type: BattleItemCommandEvent.CLICK_ITEM,
    itemId: id,
  };
  if (noWaste) event.beforeClick = () => recordPreDrink(id, snap);
  if (!runBattleItemCommand(event)) return false;
  recordAutoTunePotionUse();
  return true;
}

function executeStallPlan(plan, snap) {
  for (const attempt of plan.attempts) {
    if (STALL_ATTEMPT_EXECUTORS[attempt.kind]?.(attempt, snap)) return true;
  }
  return false;
}

function executeStallSpiritOffAttempt() {
  return !!runBattleSpiritToggleAutomation({
    type: BattleSpiritToggleEvent.CLICK_AND_RECORD,
  });
}

function executeStallFocusAttempt() {
  return !!runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK });
}

function executeStallDraughtAttempt(attempt, snap) {
  return !!runBattleItemCommand({
    type: BattleItemCommandEvent.CLICK_ITEM,
    itemId: attempt.id,
    beforeClick: () => recordPreDrink(attempt.id, snap),
  });
}

function executeScrollPlan(plan) {
  for (const id of plan.candidates) {
    if (runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_ITEM, itemId: id })) return true;
  }
  return false;
}

function recordPreDrink(potionId, snap) {
  runRecoveryLearningAutomation({
    type: RecoveryLearningEvent.RECORD_PRE_DRINK,
    potionId,
    recoveryAbs: recoveryAbs(snap),
  });
}

export function runBattleItemExecution(event = { type: EVENT_APPLY_PLAN }) {
  return battleItemExecutionEventHandlers[event.type]?.(event) ?? false;
}
