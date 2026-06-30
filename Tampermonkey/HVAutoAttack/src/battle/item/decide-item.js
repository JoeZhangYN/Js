// PURE: item 4 step 决策（gem / potion / stall topup / scroll）。
// **不读 DOM**：只读 opt / snap。
// 原 item.js 内联的 gE/isOn 探活下沉到 execute-item.js（写路径），判断逻辑全部上提到此处。
// 复用现有纯 helper：decideGem / dynamicHpThreshold / isPotionWasteful / checkCondition。
import { checkCondition } from "../../settings/condition-eval.js";
import { decideGem } from "./decide-gem.js";
import { decideScroll } from "./decide-scroll.js";
import { BattleItemFactsEvent, runBattleItemFacts } from "./item-facts.js";
import { dynamicHpThreshold } from "../dynamic-threshold.js";
import { BattleStallModeEvent, runBattleStallModeAutomation } from "../battle-stall-mode.js";
import { isPotionWasteful } from "../potion-economy.js";
import {
  RecoveryLearningEvent,
  runRecoveryLearningAutomation,
} from "../../state/recovery-learner.js";
import { isPlayerBuffActive } from "../player-buff-state.js";

const DECIDE_GEM = "decide-gem";
const DECIDE_POTION = "decide-potion";
const DECIDE_STALL_TOPUP = "decide-stall-topup";
const DECIDE_SCROLL = "decide-scroll";

export const BattleItemDecisionEvent = Object.freeze({
  DECIDE_GEM,
  DECIDE_POTION,
  DECIDE_STALL_TOPUP,
  DECIDE_SCROLL,
});

const noopItemPlan = Object.freeze({ kind: "item-plan", plan: { type: "noop" } });

const battleItemDecisionHandlers = Object.freeze({
  [DECIDE_GEM]: (event) => decideGemUse(itemDecisionInput(event, BattleItemFactsEvent.READ_GEM)),
  [DECIDE_POTION]: (event) =>
    decidePotion(itemDecisionInput(event, BattleItemFactsEvent.READ_POTION)),
  [DECIDE_STALL_TOPUP]: (event) =>
    decideStallTopup(itemDecisionInput(event, BattleItemFactsEvent.READ_STALL_TOPUP)),
  [DECIDE_SCROLL]: (event) =>
    decideScroll(itemDecisionInput(event, BattleItemFactsEvent.READ_SCROLL)),
});

const GEM_RESULT_PLAN_MAPPERS = Object.freeze({
  gem: () => ({ type: "gem" }),
  noop: () => ({ type: "noop" }),
});

export function runBattleItemDecision(event = {}) {
  return battleItemDecisionHandlers[event.type]?.(event) || noopItemPlan;
}

function itemDecisionInput(event, factsEventType) {
  if (!event?.snap) return event;
  return {
    opt: event.opt,
    ...runBattleItemFacts({ type: factsEventType, snap: event.snap }),
  };
}

function stallTopupRuntimeFacts(event) {
  return {
    manaPercent: event?.manaPercent,
    spiritPercent: event?.spiritPercent,
    playerBuffs: event?.playerBuffs,
  };
}

function readRecovery(potionId) {
  return runRecoveryLearningAutomation({
    type: RecoveryLearningEvent.READ_RECOVERY,
    potionId,
  });
}

/**
 * 复刻 useGem。无宝石（event.gemName 空）→ noop；
 * dynamicHealThreshold 且 Health Gem 时用 dynamicHpThreshold 覆盖 hp1；
 * decideGem 命中 click → {type:"gem"}，否则 noop。
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult} { kind:"item-plan", plan }
 */
function decideGemUse(event = {}) {
  const opt = event.opt || {};
  if (!event.gemName) return { kind: "item-plan", plan: { type: "noop" } };
  const optEffective = { ...opt };
  if (opt.dynamicHealThreshold && event.gemName === "Health Gem") {
    optEffective.hp1 = dynamicHpThreshold(event, opt);
  }
  const result = decideGem(optEffective, event);
  return {
    kind: "item-plan",
    plan: mapGemResultToItemPlan(result),
  };
}

function mapGemResultToItemPlan(result) {
  return GEM_RESULT_PLAN_MAPPERS[result?.kind]?.(result) ?? { type: "noop" };
}

/**
 * 复刻 deadSoon。遍历 itemOrderName/itemOrderValue，收集启用 + 条件满足 + （noWaste 时）非浪费
 * 的药品 id（保持原顺序）。isOn 可用性探活归 execute 侧（不在 decide）。
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult} { kind:"item-plan", plan }
 */
function decidePotion(event = {}) {
  const opt = event.opt || {};
  if (!opt.item || !opt.itemOrderName || !opt.itemOrderValue) {
    return { kind: "item-plan", plan: { type: "potion", candidates: [], noWaste: false } };
  }
  const name = opt.itemOrderName.split(",");
  const order = opt.itemOrderValue.split(",");
  const noWaste = !!opt.noWastePotion;
  const tol = opt.potionWasteTolerance ?? 0.7;
  const candidates = [];
  for (let i = 0; i < name.length; i++) {
    if (!opt.item[name[i]]) continue;
    const cond = opt[`item${name[i]}Condition`];
    if (!checkCondition(cond, event.conditionFacts)) continue;
    // noWaste 防溢出仅作用于"无显式条件"的常开药；用户显式设了条件（含非门带状）且已满足
    //  → "条件符合就该用"，不再被绝对量防溢出悄悄否决（根治 message-1 "条件满足却不放"）。
    const hasExplicitCond = typeof cond !== "undefined";
    if (
      noWaste &&
      !hasExplicitCond &&
      isPotionWasteful(order[i], event.deficitFacts, tol, readRecovery)
    ) {
      continue;
    }
    candidates.push(order[i]);
  }
  return { kind: "item-plan", plan: { type: "potion", candidates, noWaste } };
}

/**
 * 复刻 stallTopup（含 tryStallSpiritOff / tryStallFocus / tryStallDraught 的判断部分）。
 * 非 stall 模式 → noop；否则按 tryFirst 顺序产出满足条件的 attempts（spirit-off → focus → draught）。
 * 元素探活与点击归 execute 侧；此处只判断条件是否成立。
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult} { kind:"item-plan", plan }
 */
function decideStallTopup(event = {}) {
  const opt = event.opt || {};
  if (opt.stallMode === false) return { kind: "item-plan", plan: { type: "noop" } };
  if (
    !runBattleStallModeAutomation({
      type: BattleStallModeEvent.READ_ACTIVE,
      opt,
      roundNow: event?.roundNow,
      roundAll: event?.roundAll,
      monsterFacts: event?.monsterFacts,
      overcharge: event?.overcharge,
    })
  ) {
    return { kind: "item-plan", plan: { type: "noop" } };
  }

  const attempts = [];

  // step 0: 关 Spirit Stance（防抖）
  const lastToggle = event.lastSpiritToggleGlobalTurn ?? -999;
  const cooldown = opt.spiritToggleMinInterval ?? 3;
  if (
    event.spiritOn &&
    opt.stallTurnOffSpirit !== false &&
    (event.globalTurn || 0) - lastToggle >= cooldown
  ) {
    attempts.push({ kind: "spirit-off" });
  }

  // step 1: Focus（OC 高 + MP 未满 + 无 Channeling）
  if (
    opt.stallFocus !== false &&
    !event.spiritOn &&
    (event.overcharge || 0) >= (opt.stallFocusOcThreshold ?? 60) &&
    (event.manaPercent ?? 100) < (opt.stallFocusMpMax ?? 80) &&
    !isPlayerBuffActive(event, "channeling")
  ) {
    attempts.push({ kind: "focus" });
  }

  // step 2: MP/SP Draught 兜底
  for (const potId of runBattleStallModeAutomation({
    type: BattleStallModeEvent.READ_TOPUP_CANDIDATES,
    opt,
    ...stallTopupRuntimeFacts(event),
  })) {
    attempts.push({ kind: "draught", id: potId });
  }

  return { kind: "item-plan", plan: { type: "stall", attempts } };
}
