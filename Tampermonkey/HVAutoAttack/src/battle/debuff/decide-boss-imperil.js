// PURE 决策：给未上 Imperil 的 boss 选 213 施放目标（含 AoE 覆盖优化），返 ActionResult。
// 不读 DOM / 不调 g() / 不写 setValue —— bestIdx 算法忠实复刻自旧 boss-imperil.js::runBossImperil。
// 命中 → {kind:"click-skill-then-target", skillId:"213", targetId:id}：
//   该 kind 的 dispatch 已内置 Spirit 前置 + attemptClickWithTarget，正好对应原
//   checkAndActivateSpirit + attemptClickWithTarget，无需新 kind。
// 无目标 → {kind:"noop"}。
import { aliveByOrder } from "../monster-view.js";
import { bossCoverageWindow } from "../target-strategy.js";

const EVENT_CAN_CAST = "canCast";
const EVENT_DECIDE = "decide";

export const BossImperilEvent = Object.freeze({
  CAN_CAST: EVENT_CAN_CAST,
  DECIDE: EVENT_DECIDE,
});

function canCastBossImperil(event) {
  const opt = event?.opt || {};
  if (event?.stallActive) return false;
  if (opt?.debuffSkillSwitch === false || !event?.imperilSkillReady) return false;
  if (event?.skipImperilForBigSkill) return false;
  return true;
}

/**
 * 决定给哪只未上 Imperil 的 boss 施放 213（AoE 窗口尽量覆盖多个 needy boss）。
 * 入口自守卫：offensive-debuff stall ruling / debuffSkillSwitch / skillReady["213"] / skip ruling。
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult}
 */
function decideBossImperil(event) {
  if (!canCastBossImperil(event)) return { kind: "noop" };
  const opt = event?.opt || {};
  const sortedAlive = aliveByOrder(event?.monsterFacts || []);
  const isBossNoIm = (m) => m.isBoss && !m.buffs.includes("imperil");
  if (!sortedAlive.some(isBossNoIm)) return { kind: "noop" };
  // AoE 覆盖窗口走 target-strategy.bossCoverageWindow（backward 窗口 [c-aoe+1,c] + tie-break 优先 needy 自身）。
  const aoe = event?.imperilAoe || opt.debuffSkillAoe?.Im || 1;
  const best = bossCoverageWindow(sortedAlive, aoe, isBossNoIm);
  if (!best) return { kind: "noop" };
  return {
    kind: "click-skill-then-target",
    skillId: "213",
    targetId: best.id,
  };
}

export function runBossImperilAutomation(event = { type: EVENT_DECIDE }) {
  const type = event.type || EVENT_DECIDE;
  if (type === EVENT_CAN_CAST) return canCastBossImperil(event);
  if (type === EVENT_DECIDE) return decideBossImperil(event);
  return undefined;
}
