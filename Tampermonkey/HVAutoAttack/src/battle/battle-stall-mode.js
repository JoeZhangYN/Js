const EVENT_READ_ACTIVE = "readActive";
const EVENT_READ_TOPUP_CANDIDATES = "readTopupCandidates";

export const BattleStallModeEvent = Object.freeze({
  READ_ACTIVE: EVENT_READ_ACTIVE,
  READ_TOPUP_CANDIDATES: EVENT_READ_TOPUP_CANDIDATES,
});

/**
 * 拖战 (stall) 判断：拖时间让资源回流，下场战斗用满 OC + MP + SP 开局。
 *
 * 触发条件：
 *  1. 不是最后一轮（roundNow < roundAll）
 *  2. 仅剩 1 怪存活
 *  3. 怪还活着且 hpRatio 足够高，避免在 monster 即将被秒杀的回合白拖
 *  4. OC 没满（< 250），有继续刷的空间
 */
function isStallActive(snap, opt, roundNow = snap?.roundNow, roundAll = snap?.roundAll) {
  if (opt?.stallMode === false) return false;
  if (!roundNow || !roundAll || roundNow >= roundAll) return false;
  const alive = (snap?.view || []).filter((m) => !m.isDead);
  if (alive.length !== 1) return false;
  if (alive[0].hpPercent < 0.3) return false;
  if ((snap?.oc || 0) >= 250) return false;
  return true;
}

/**
 * Stall 模式专属：仅 Draught（Replenishment 慢回 buff），百分比控制。
 */
function readTopupCandidates(snap, opt = {}) {
  const candidates = [];
  const mpFloor = opt.stallTopupMpFloor ?? 70;
  const spFloor = opt.stallTopupSpFloor ?? 70;
  if ((snap?.mp ?? 100) < mpFloor && !snap?.playerBuffs?.includes("manapot")) {
    candidates.push(11291);
  }
  if ((snap?.sp ?? 100) < spFloor && !snap?.playerBuffs?.includes("spiritpot")) {
    candidates.push(11391);
  }
  return candidates;
}

export function runBattleStallModeAutomation(event = { type: EVENT_READ_ACTIVE }) {
  if (event.type === EVENT_READ_ACTIVE) {
    return isStallActive(event.snap, event.opt, event.roundNow, event.roundAll);
  }
  if (event.type === EVENT_READ_TOPUP_CANDIDATES) {
    return readTopupCandidates(event.snap, event.opt);
  }
  return undefined;
}
