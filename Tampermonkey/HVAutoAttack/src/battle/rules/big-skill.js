// PURE: OFC/FRD 即将就绪时跳过全员 Weaken/Imperil 的判定（Phase 5b-5）。
// 从 main-loop.js 抽出共享给 BATTLE_RULES 的 Weaken/Imperil rule 与（过渡期）main-loop 自身，
// 单一来源避免重复。不读 DOM / 不调 g()——只吃 opt + snap。
/**
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @param {"We"|"Im"} kind
 * @returns {boolean} true = 应跳过该全员 debuff（让位给即将就绪的大招）
 */
export function shouldSkipForBigSkill(opt, snap, kind) {
  if (opt[`skipDebuffForBigSkill_${kind}`] === false) return false;
  // Boss 存活时不跳过 Imperil——Imperil 破防让 OFC 打 boss 更狠（一发不够也增伤）。
  // Weaken 减对面伤害，不影响 OFC 杀 boss 速度，仍按 OFC 优化跳过。
  if (kind === "Im" && snap.monsters.some((m) => m.isBoss && !m.isDead)) return false;
  const N = opt.skipDebuffForBigSkillThreshold ?? 3;
  if (snap.aliveCount <= (opt.physicalDowngradeThreshold || 3)) return false;
  const ocFutureMax = snap.oc + N * 10;
  for (const skill of ["OFC", "FRD"]) {
    if (!opt[`skill_${skill}`] && !opt.skill?.[skill]) continue;
    if ((snap.cdMap[skill] ?? 99) > N) continue;
    const ocNeed = skill === "OFC" ? 205 : 105;
    if (ocFutureMax >= ocNeed) return true;
  }
  return false;
}
