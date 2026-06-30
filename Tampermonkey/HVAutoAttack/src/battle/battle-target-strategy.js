const EVENT_FIRST_BY_FIN_WEIGHT = "firstByFinWeight";
const EVENT_FIRST_BY_ORDER = "firstByOrder";
const EVENT_HIGHEST_ABS_HP = "highestAbsHp";
const EVENT_SELF_TARGET = "selfTarget";
const EVENT_AOE_NEIGHBOR_ANCHOR = "aoeNeighborAnchor";
const EVENT_BOSS_COVERAGE_WINDOW = "bossCoverageWindow";

export const BattleTargetStrategyEvent = Object.freeze({
  FIRST_BY_FIN_WEIGHT: EVENT_FIRST_BY_FIN_WEIGHT,
  FIRST_BY_ORDER: EVENT_FIRST_BY_ORDER,
  HIGHEST_ABS_HP: EVENT_HIGHEST_ABS_HP,
  SELF_TARGET: EVENT_SELF_TARGET,
  AOE_NEIGHBOR_ANCHOR: EVENT_AOE_NEIGHBOR_ANCHOR,
  BOSS_COVERAGE_WINDOW: EVENT_BOSS_COVERAGE_WINDOW,
});

const battleTargetStrategyEventHandlers = Object.freeze({
  [EVENT_FIRST_BY_FIN_WEIGHT]: (event) => firstByFinWeight(event.alive),
  [EVENT_FIRST_BY_ORDER]: (event) => firstByOrder(event.alive),
  [EVENT_HIGHEST_ABS_HP]: (event) => highestAbsHp(event.alive),
  [EVENT_SELF_TARGET]: (event) => selfTarget(event.monster),
  [EVENT_AOE_NEIGHBOR_ANCHOR]: (event) =>
    aoeNeighborAnchor(event.monster, event.nextMonster, event.aoeCount),
  [EVENT_BOSS_COVERAGE_WINDOW]: (event) =>
    bossCoverageWindow(event.alive, event.aoe, event.isNeedy),
});

function firstByFinWeight(alive) {
  if (!alive || !alive.length) return undefined;
  return alive.reduce((best, m) => (m.finWeight < best.finWeight ? m : best));
}

function firstByOrder(alive) {
  if (!alive || !alive.length) return undefined;
  return alive.reduce((best, m) => (m.order < best.order ? m : best));
}

function highestAbsHp(alive) {
  if (!alive || !alive.length) return undefined;
  return alive.reduce((best, m) => {
    if (m.hpAbsNow > best.hpAbsNow) return m;
    if (m.hpAbsNow === best.hpAbsNow && m.order < best.order) return m;
    return best;
  });
}

function selfTarget(m) {
  return m.id;
}

function aoeNeighborAnchor(self, next, aoeCount) {
  return aoeCount >= 2 && next && !next.isDead ? next.id : self.id;
}

function bossCoverageWindow(alive, aoe, isNeedy) {
  let bestIdx = -1;
  let bestCov = -1;
  let bestSelfNeed = false;
  for (let c = 0; c < alive.length; c += 1) {
    const start = Math.max(0, c - aoe + 1);
    let cov = 0;
    for (let i = start; i <= c; i += 1) if (isNeedy(alive[i])) cov += 1;
    const selfNeed = isNeedy(alive[c]);
    if (cov > bestCov || (cov === bestCov && selfNeed && !bestSelfNeed)) {
      bestCov = cov;
      bestIdx = c;
      bestSelfNeed = selfNeed;
    }
  }
  return bestIdx >= 0 && bestCov > 0 ? alive[bestIdx] : null;
}

export function runBattleTargetStrategy(event = { type: EVENT_FIRST_BY_ORDER }) {
  return battleTargetStrategyEventHandlers[event.type]?.(event);
}
