// PURE: 宝石使用决策（Health/Mana/Spirit/Mystic Gem）。
// gemName 由 SHELL 从 DOM 读出后传入（PURE 不读 DOM）。

/**
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @param {string|null} gemName 当前 #ikey_p 的 textContent，无则 null
 * @returns {import("../../core/types.js").ActionResult}
 */
export function decideGem(opt, snap, gemName) {
  if (!gemName) return { kind: "noop" };
  const trigger =
    (gemName === "Health Gem" && snap.hp <= opt.hp1) ||
    (gemName === "Mana Gem" && snap.mp <= opt.mp1) ||
    (gemName === "Spirit Gem" && snap.sp <= opt.sp1) ||
    gemName === "Mystic Gem";
  if (!trigger) return { kind: "noop" };
  return { kind: "click", selector: "#ikey_p" };
}
