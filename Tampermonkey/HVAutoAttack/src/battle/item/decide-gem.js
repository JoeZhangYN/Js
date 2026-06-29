// PURE: 宝石使用决策（Health/Mana/Spirit/Mystic Gem）。
// gemName 由 SHELL 从 DOM 读出后传入（PURE 不读 DOM）。

/**
 * @param {object} opt
 * @param {object} event
 * @returns {{kind:"gem"}|{kind:"noop"}}
 */
export function decideGem(opt, event) {
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
