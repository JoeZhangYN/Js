// PURE: 法术阶选择（attackStatus !== 0 模式下的 tier 1/2/3 决策）。
// 不读 DOM / 不调 g()。
import { checkCondition } from "../../settings/condition-eval.js";

/**
 * 决定法术施放哪一阶（0=不施法）。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {{ tier: 0|1|2|3 }}
 */
export function selectSpellTier(opt, snap) {
  const attackStatus = snap.attackStatus;
  if (attackStatus === 0 || attackStatus == null) return { tier: 0 };

  const channelLock =
    opt.channelForceHighTier !== false && snap.channeling;

  const downgrade =
    !channelLock &&
    opt.spellTierDowngrade !== false &&
    snap.aliveCount <= (opt.spellDowngradeThreshold || 3);

  const id1 = `1${attackStatus}1`;
  const id2 = `1${attackStatus}2`;
  const id3 = `1${attackStatus}3`;
  const ready1 = !!snap.skillReady[id1];
  const ready2 = !!snap.skillReady[id2];
  const ready3 = !!snap.skillReady[id3];

  if (downgrade) return { tier: ready1 ? 1 : 0 };

  const highMet = channelLock || checkCondition(opt.highSkillCondition, snap);
  const midMet = channelLock || checkCondition(opt.middleSkillCondition, snap);
  if (highMet && ready3) return { tier: 3 };
  if (midMet && ready2) return { tier: 2 };
  if (ready1) return { tier: 1 };
  return { tier: 0 };
}
