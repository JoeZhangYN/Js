// PURE: 元素灌注决策。attackStatus 决定灌注种类，已存在效果则跳过。
import { checkCondition } from "../../settings/condition-eval.js";
import { BattlePlayerBuffStateEvent, runBattlePlayerBuffState } from "../player-buff-state.js";

const INFUSION_LIB = Object.freeze([
  null,
  Object.freeze({ id: 12101, img: "fireinfusion" }),
  Object.freeze({ id: 12201, img: "coldinfusion" }),
  Object.freeze({ id: 12301, img: "elecinfusion" }),
  Object.freeze({ id: 12401, img: "windinfusion" }),
  Object.freeze({ id: 12501, img: "holyinfusion" }),
  Object.freeze({ id: 12601, img: "darkinfusion" }),
]);

const EVENT_DECIDE = "decide";

export const BattleInfusionDecisionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleInfusionDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: decideInfusion,
});

/**
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult}
 */
function decideInfusion(event = {}) {
  const opt = event.opt || {};
  if (!opt.infusionSwitch) return { kind: "noop" };
  if (!checkCondition(opt.infusionCondition, event.conditionFacts)) return { kind: "noop" };
  const status = event.attackStatus;
  if (!status || status === 0) return { kind: "noop" };
  const lib = INFUSION_LIB[status];
  if (!lib) return { kind: "noop" };
  // 已存在该灌注 buff → 不重复施
  if (
    runBattlePlayerBuffState({
      type: BattlePlayerBuffStateEvent.READ_ACTIVE,
      state: event,
      img: lib.img,
    })
  ) {
    return { kind: "noop" };
  }
  return {
    kind: "item-command",
    itemId: lib.id,
  };
}

export function runBattleInfusionDecision(event = { type: EVENT_DECIDE }) {
  return battleInfusionDecisionEventHandlers[event.type]?.(event) ?? { kind: "noop" };
}
