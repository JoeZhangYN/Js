// PoC L1+B+F：动态阈值（CVaR p95 + 自学 safetyPad）。
// 替代死阈值 option.hp1 / mp1 / sp1。
// 配置：option.dynamicHealThreshold (开关) + option.dynamicHealSafetyPad (静态值) + option.autoTune (启用自学覆盖静态)
//
// 注：不再 100% PURE——auto-tune 入口读 GM_*。可接受：tune 状态属于持久化跨 battle 状态。
import { AutoTuneEvent, runAutoTuneAutomation } from "../state/auto-tune.js";

const EVENT_READ_HP_THRESHOLD = "readHpThreshold";

export const BattleDynamicThresholdEvent = Object.freeze({
  READ_HP_THRESHOLD: EVENT_READ_HP_THRESHOLD,
});

const battleDynamicThresholdEventHandlers = Object.freeze({
  [EVENT_READ_HP_THRESHOLD]: (event) => dynamicHpThreshold(event.facts, event.opt),
});

/**
 * 估算战斗剩余回合（玩家 DPS 输出 / 怪物总剩余 HP）。
 * 简化版：用活怪 HP% 反推。
 * @param {object} event
 * @returns {number} 估计剩余回合数
 */
function estimateRemainingTurns(event) {
  const aliveHpPercents = event?.aliveMonsterHpPercents || [];
  if (aliveHpPercents.length === 0) return 0;
  // 玩家平均每回合杀怪进度（占总怪 HP 的比例）。HV 法术模式 ~25-50% / turn，物理 ~10-20% / turn。
  const playerKillRatePerTurn = event?.attackStatus !== 0 ? 0.35 : 0.15;
  const totalRemainingHp = aliveHpPercents.reduce((s, hpPercent) => s + hpPercent, 0);
  return Math.ceil(totalRemainingHp / Math.max(0.05, playerKillRatePerTurn));
}

/**
 * 动态 HP 阈值：低于此值要回血。
 * @param {object} event
 * @param {object} opt
 * @returns {number} 触发阈值（HP 百分比 0..100）
 */
function dynamicHpThreshold(event, opt = {}) {
  const fallback = opt.hp1 ?? 50;
  if (!opt.dynamicHealThreshold) return fallback;
  if (!event?.playerIncomingDps || event.playerIncomingDps.sampleCount < 2) {
    return fallback;
  }
  const turns = estimateRemainingTurns(event);
  // CVaR 风格：用 perTurnP95 替 mean perTurn，触发更早 / 更保守。
  // 数据稀疏时 p95 退化为 mean（quantile 取最大值 ≈ mean），自然 fallback。
  const dpsEstimate = event.playerIncomingDps.perTurnP95 ?? event.playerIncomingDps.perTurn;
  const expectedTotalDmg = dpsEstimate * turns;
  // F: 自学 safetyPad（auto-tune 开则用学到的；否则用用户配置）
  const padding = opt.autoTune
    ? runAutoTuneAutomation({ type: AutoTuneEvent.READ_PAD })
    : (opt.dynamicHealSafetyPad ?? 1.3);
  const playerMaxHp = opt.playerMaxHp || 17000;
  const dangerHpPct = (expectedTotalDmg * padding * 100) / playerMaxHp;
  return Math.min(80, Math.max(fallback / 2, dangerHpPct));
}

export function runBattleDynamicThreshold(event = { type: EVENT_READ_HP_THRESHOLD }) {
  return battleDynamicThresholdEventHandlers[event?.type]?.(event);
}
