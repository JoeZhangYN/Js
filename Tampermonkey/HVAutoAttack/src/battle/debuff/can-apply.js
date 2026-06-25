// PURE: debuff 可施性判断（canApplyDebuffPure，SSOT）。AoE 目标选择已迁出至 battle/target-strategy.js。
// decide-cast-all.js（全员）与 decide-de-skill.js（单目标）共享，避免两份 copy 漂移。
// 不读 DOM / 不调 g() / 不写 setValue —— 全程基于传入的 snapshot 数据。
import { DEBUFF_SKILL_LIB } from "../../data/debuff-lib.js";

/**
 * 单怪物的"是否能施 debuff"判断（移植自旧 DOM 版 canApplyDebuff，但用 snap 不读 DOM）。
 * @param {{img:string,turns:number}[]} mEffects 怪物 buff 列表（含剩余回合）
 * @param {string} debuffKey
 * @param {object} opt
 * @param {boolean} skillIsReady opacity 不为 0.5
 * @returns {"cast"|"blocked"|"skip"}
 */
export function canApplyDebuffPure(mEffects, debuffKey, opt, skillIsReady) {
  const skill = DEBUFF_SKILL_LIB.get(debuffKey);
  // needsRecast 等价：img 不存在 或 剩余 ≤ 1
  const existing = mEffects.find((e) => e.img === skill.img);
  if (existing && existing.turns > 1) return "skip";
  if (!skillIsReady) return "skip";
  // 槽位检查
  if (mEffects.length < 6 || !opt.debuffSkillTurnAlert) return "cast";
  const lastTurn = mEffects.length ? mEffects[mEffects.length - 1].turns : 0;
  const threshold = (opt.debuffSkillTurn && opt.debuffSkillTurn[debuffKey]) || 0;
  if (lastTurn >= threshold) return "cast";
  return "blocked";
}
