// SHELL: 把 decide-item 的 ItemPlan 翻译为 DOM 副作用 + 状态记账。
// 只写不判断（判断全在 decide-item.js）；isOn/gE 探活属写路径安全读（与原 item.js 一致）。
// 记账：autoTune 用药事件 / Spirit toggle cooldown / Focus command / recordPreDrink。
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
import { recordActionEffectEvidence } from "../battle-action-effect-recording.js";
import { recordConsumedRecoveryItem } from "./item-consumption-learning.js";

const EVENT_APPLY_PLAN = "applyPlan";
const EVENT_UNKNOWN_ITEM_EXECUTION = "unknownItemExecutionEvent";

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

function recoveryAbs(snap) {
  return { hp: snap?.hpAbs, mp: snap?.mpAbs, sp: snap?.spAbs };
}

/**
 * @param {import("../../core/types.js").ItemPlan} plan
 * @param {import("../../core/types.js").BattleSnapshot} snap
 */
function applyItemPlan(plan, snap) {
  try {
    return itemExecutionActed(ITEM_PLAN_EXECUTORS[plan?.type]?.(plan, snap));
  } catch (error) {
    recordItemExecutionFailure(plan, "itemSubCommandThrew", error);
    return false;
  }
}

function itemExecutionActed(result) {
  if (result?.kind === "failed") return false;
  return Boolean(result);
}

function executeNoopPlan() {
  return false;
}

function executeGemPlan() {
  if (!itemExecutionActed(runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_GEM }))) {
    return false;
  }
  recordConsumedRecoveryItem();
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
  if (!itemExecutionActed(runBattleItemCommand(event))) return false;
  recordConsumedRecoveryItem();
  return true;
}

function executeStallPlan(plan, snap) {
  for (const attempt of plan.attempts) {
    if (itemExecutionActed(STALL_ATTEMPT_EXECUTORS[attempt.kind]?.(attempt, snap))) return true;
  }
  return false;
}

function executeStallSpiritOffAttempt() {
  return runBattleSpiritToggleAutomation({
    type: BattleSpiritToggleEvent.CLICK_AND_RECORD,
  });
}

function executeStallFocusAttempt() {
  return runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK });
}

function executeStallDraughtAttempt(attempt, snap) {
  const acted = runBattleItemCommand({
    type: BattleItemCommandEvent.CLICK_ITEM,
    itemId: attempt.id,
    beforeClick: () => recordPreDrink(attempt.id, snap),
  });
  if (itemExecutionActed(acted)) recordConsumedRecoveryItem();
  return acted;
}

function executeScrollPlan(plan) {
  for (const id of plan.candidates) {
    if (
      itemExecutionActed(
        runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_ITEM, itemId: id })
      )
    ) {
      return true;
    }
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

function recordItemExecutionFailure(plan, reason, error) {
  recordActionEffectEvidence({
    result: {
      kind: "item-execution-event",
      reason,
      planType: plan?.type ?? null,
    },
    acted: false,
    knownResultKind: true,
    failureReason: reason,
    executionError: error?.message || String(error),
  });
}

function rejectUnknownItemExecutionEvent(event) {
  recordActionEffectEvidence({
    result: {
      kind: "unknown-item-execution-event",
      reason: EVENT_UNKNOWN_ITEM_EXECUTION,
      eventType: event?.type ?? null,
    },
    acted: false,
    knownResultKind: false,
    failureReason: EVENT_UNKNOWN_ITEM_EXECUTION,
  });
  return false;
}

export function runBattleItemExecution(event = { type: EVENT_APPLY_PLAN }) {
  return (
    battleItemExecutionEventHandlers[event?.type]?.(event) ?? rejectUnknownItemExecutionEvent(event)
  );
}
