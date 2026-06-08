// PURE 决策：给未上 Imperil 的 boss 选 213 施放目标（含 AoE 覆盖优化），返 ActionResult。
// 不读 DOM / 不调 g() / 不写 setValue —— bestIdx 算法忠实复刻自旧 boss-imperil.js::runBossImperil。
// 命中 → {kind:"click-skill-then-target", skillSel:"213", targetSel:`#mkey_${id}`}：
//   该 kind 的 dispatch 已内置 Spirit 前置 + attemptClickWithTarget，正好对应原
//   checkAndActivateSpirit + attemptClickWithTarget，无需新 kind。
// 无目标 → {kind:"noop"}。
import { aliveMonstersByOrder } from "../snapshot.js";

/**
 * 决定给哪只未上 Imperil 的 boss 施放 213（AoE 窗口尽量覆盖多个 needy boss）。
 * 调用前提（由 rule.when 守卫）：opt.debuffSkillSwitch !== false && snap.skillReady["213"]。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {import("../../core/types.js").ActionResult}
 */
export function decideBossImperil(opt, snap) {
  if (!snap.skillReady["213"]) return { kind: "noop" };
  const sortedAlive = aliveMonstersByOrder(snap);
  const isBossNoIm = (m) => m.isBoss && !m.buffs.includes("imperil");
  if (!sortedAlive.some(isBossNoIm)) return { kind: "noop" };
  // HV AoE 模式 = backward（参 legacy castDebuffOnAll：click i+1 覆盖 [i, i+1]）。窗口 [c-aoe+1, c]。
  // tie-break：相同覆盖时优先 click needy boss 自身——保证它必被击中（防 backward/forward 模式不匹配）。
  const aoe = (snap.spellAoe && snap.spellAoe.Imperil) || opt.debuffSkillAoe?.Im || 1;
  let bestIdx = -1,
    bestCov = -1,
    bestSelfNeed = false;
  for (let c = 0; c < sortedAlive.length; c++) {
    const start = Math.max(0, c - aoe + 1);
    const end = c;
    let cov = 0;
    for (let i = start; i <= end; i++) if (isBossNoIm(sortedAlive[i])) cov++;
    const selfNeed = isBossNoIm(sortedAlive[c]);
    if (cov > bestCov || (cov === bestCov && selfNeed && !bestSelfNeed)) {
      bestCov = cov;
      bestIdx = c;
      bestSelfNeed = selfNeed;
    }
  }
  if (bestIdx < 0 || bestCov <= 0) return { kind: "noop" };
  return {
    kind: "click-skill-then-target",
    skillSel: "213",
    targetSel: `#mkey_${sortedAlive[bestIdx].id}`,
  };
}
