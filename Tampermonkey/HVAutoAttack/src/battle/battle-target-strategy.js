import {
  aoeNeighborAnchor,
  bossCoverageWindow,
  firstByFinWeight,
  firstByOrder,
  highestAbsHp,
  selfTarget,
} from "./target-strategy.js";

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

export function runBattleTargetStrategy(event = { type: EVENT_FIRST_BY_ORDER }) {
  return battleTargetStrategyEventHandlers[event.type]?.(event);
}
