import { isPlayerBuffActive } from "./player-buff-state.js";

const EVENT_READ_ACTIVE = "readActive";
const EVENT_READ_TOPUP_CANDIDATES = "readTopupCandidates";

export const BattleStallModeEvent = Object.freeze({
  READ_ACTIVE: EVENT_READ_ACTIVE,
  READ_TOPUP_CANDIDATES: EVENT_READ_TOPUP_CANDIDATES,
});

function aliveHpPercents(event) {
  return (event?.monsterFacts || [])
    .filter((monster) => !monster.isDead)
    .map((monster) => monster.hpPercent);
}

/**
 * 拖战 (stall) 判断：拖时间让资源回流，下场战斗用满 OC + MP + SP 开局。
 *
 * 触发条件：
 *  1. 不是最后一轮（roundNow < roundAll）
 *  2. 仅剩 1 怪存活
 *  3. 怪还活着且 hpRatio 足够高，避免在 monster 即将被秒杀的回合白拖
 *  4. OC 没满（< 250），有继续刷的空间
 */
function isStallActive(event) {
  const roundNow = event?.roundNow;
  const roundAll = event?.roundAll;
  if (event?.opt?.stallMode === false) return false;
  if (!roundNow || !roundAll || roundNow >= roundAll) return false;
  const hpPercents = aliveHpPercents(event);
  if (hpPercents.length !== 1) return false;
  if (hpPercents[0] < 0.3) return false;
  if ((event?.overcharge || 0) >= 250) return false;
  return true;
}

/**
 * Stall 模式专属：仅 Draught（Replenishment 慢回 buff），百分比控制。
 */
function readTopupCandidates(event) {
  const candidates = [];
  const opt = event?.opt || {};
  const mpFloor = opt.stallTopupMpFloor ?? 70;
  const spFloor = opt.stallTopupSpFloor ?? 70;
  if ((event?.manaPercent ?? 100) < mpFloor && !isPlayerBuffActive(event, "manapot")) {
    candidates.push(11291);
  }
  if ((event?.spiritPercent ?? 100) < spFloor && !isPlayerBuffActive(event, "spiritpot")) {
    candidates.push(11391);
  }
  return candidates;
}

export function runBattleStallModeAutomation(event = { type: EVENT_READ_ACTIVE }) {
  if (event.type === EVENT_READ_ACTIVE) {
    return isStallActive(event);
  }
  if (event.type === EVENT_READ_TOPUP_CANDIDATES) {
    return readTopupCandidates(event);
  }
  return undefined;
}
