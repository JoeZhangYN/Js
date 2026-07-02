// PoC：药品经济学。避免"喝药满血溢出"浪费 + 拖战策略。
// HV 药品恢复量为定值（不是 %），但实际答案统一由 recovery-learner READ_RECOVERY 入口提供。

/**
 * 喝药是否浪费（deficit 不够大）。
 * 恢复量答案必须由调用方通过 recovery-learner 入口注入；本模块只做浪费判定。
 * @param {number|string} potionId
 * @param {{hpDeficit:number,mpDeficit:number,spDeficit:number}} snap
 * @param {number} tolerance 0..1 容差，0.7=允许 30% 溢出
 * @param {(id:number)=>{stat:string,amount:number}|null} getRecovery
 */
const EVENT_IS_WASTEFUL = "isWasteful";

export const BattlePotionEconomyEvent = Object.freeze({
  IS_WASTEFUL: EVENT_IS_WASTEFUL,
});

const battlePotionEconomyEventHandlers = Object.freeze({
  [EVENT_IS_WASTEFUL]: (event) =>
    isPotionWasteful(event.potionId, event.deficitFacts, event.tolerance, event.readRecovery),
});

function isPotionWasteful(potionId, snap, tolerance = 0.7, getRecovery) {
  if (typeof getRecovery !== "function") {
    throw new TypeError("isPotionWasteful requires recovery learner query");
  }
  const info = getRecovery(Number.parseInt(potionId, 10));
  if (!info) return false;
  const deficit = snap[`${info.stat}Deficit`] || 0;
  return deficit < info.amount * tolerance;
}

export function runBattlePotionEconomy(event = { type: EVENT_IS_WASTEFUL }) {
  return battlePotionEconomyEventHandlers[event?.type]?.(event) ?? false;
}
