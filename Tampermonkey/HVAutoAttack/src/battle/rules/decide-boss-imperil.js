// PURE 决策：给未上 Imperil 的 boss 选 213 施放目标（含 AoE 覆盖优化），返 ActionResult。
// 不读 DOM / 不调 g() / 不写 setValue —— bestIdx 算法忠实复刻自旧 boss-imperil.js::runBossImperil。
// 命中 → {kind:"click-skill-then-target", skillSel:"213", targetSel:`#mkey_${id}`}：
//   该 kind 的 dispatch 已内置 Spirit 前置 + attemptClickWithTarget，正好对应原
//   checkAndActivateSpirit + attemptClickWithTarget，无需新 kind。
// 无目标 → {kind:"noop"}。
import { aliveByOrder } from "../monster-view.js";
import { bossCoverageWindow } from "../target-strategy.js";

/**
 * 决定给哪只未上 Imperil 的 boss 施放 213（AoE 窗口尽量覆盖多个 needy boss）。
 * 调用前提（由 rule.when 守卫）：opt.debuffSkillSwitch !== false && snap.skillReady["213"]。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {import("../../core/types.js").ActionResult}
 */
export function decideBossImperil(opt, snap) {
  if (!snap.skillReady["213"]) return { kind: "noop" };
  const sortedAlive = aliveByOrder(snap.view);
  const isBossNoIm = (m) => m.isBoss && !m.buffs.includes("imperil");
  if (!sortedAlive.some(isBossNoIm)) return { kind: "noop" };
  // AoE 覆盖窗口走 target-strategy.bossCoverageWindow（backward 窗口 [c-aoe+1,c] + tie-break 优先 needy 自身）。
  const aoe = (snap.spellAoe && snap.spellAoe.Imperil) || opt.debuffSkillAoe?.Im || 1;
  const best = bossCoverageWindow(sortedAlive, aoe, isBossNoIm);
  if (!best) return { kind: "noop" };
  return {
    kind: "click-skill-then-target",
    skillSel: "213",
    targetSel: `#mkey_${best.id}`,
  };
}
