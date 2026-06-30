// PURE: 宝石使用决策（Health/Mana/Spirit/Mystic Gem）。
// gemName 由 SHELL 从 DOM 读出后传入（PURE 不读 DOM）。

const EVENT_DECIDE = "decide";

export const BattleGemDecisionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleGemDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: (event) => decideGem(event.opt, event),
});

/**
 * @param {object} opt
 * @param {object} event
 * @returns {{kind:"gem"}|{kind:"noop"}}
 */
function decideGem(opt, event) {
  const gemName = event?.gemName;
  if (!gemName) return { kind: "noop" };
  const trigger =
    (gemName === "Health Gem" && event?.healthPercent <= opt.hp1) ||
    (gemName === "Mana Gem" && event?.manaPercent <= opt.mp1) ||
    (gemName === "Spirit Gem" && event?.spiritPercent <= opt.sp1) ||
    gemName === "Mystic Gem";
  if (!trigger) return { kind: "noop" };
  return { kind: "gem" };
}

export function runBattleGemDecision(event = { type: EVENT_DECIDE }) {
  return battleGemDecisionEventHandlers[event.type]?.(event) ?? { kind: "noop" };
}
