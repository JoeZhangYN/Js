// Utility scoring decision engine（A 方案 PoC）。
// 替代 first-match 优先级：枚举所有候选 action 各自打分，取分数最高（且 > 0）的执行。
// 优势：能比较权衡（OFC vs FRD vs T3，分数化），不再死优先级；F (auto-tune) 后续可学权重。
//
// ActionCandidate 契约：
// - name: 日志用
// - score: ≥ 0；0 视为不可用；越高越好
// - dispatch: 若被选中调用此函数执行副作用
// - explain: 可选打分理由（debug 日志用）
import { g } from "../state/store.js";

/**
 * @typedef {object} ActionCandidate
 * @property {string} name
 * @property {number} score
 * @property {() => void} dispatch
 * @property {string} [explain]
 */

/**
 * PURE 选择：挑最高分（>0）候选并打日志，**不执行**（无 dispatch）。无可行候选返 null。
 * 供 decideAttack 等纯决策复用（候选可为 {code,...} 或 {name,...}，日志取 name ?? code）。
 * @param {Array<{score:number, name?:string, code?:string, explain?:string}>} candidates
 * @returns {object|null} 最高分候选（原对象）
 */
export function pickByUtility(candidates) {
  const valid = candidates
    .filter((c) => c && c.score > 0)
    .sort((a, b) => b.score - a.score);
  if (valid.length === 0) return null;
  const winner = valid[0];
  if (g("option")?.dynamicHealLog) {
    const label = (c) => c.name ?? c.code;
    const runners = valid
      .slice(1, 3)
      .map((c) => `${label(c)}=${c.score.toFixed(0)}`)
      .join(", ");
    console.log(
      `[utility] ${label(winner)} score=${winner.score.toFixed(0)}${winner.explain ? " (" + winner.explain + ")" : ""}${runners ? ` vs [${runners}]` : ""}`
    );
  }
  return winner;
}

/**
 * 选最高分候选并执行其 dispatch（= pickByUtility + winner.dispatch()）。
 * @param {ActionCandidate[]} candidates
 * @returns {ActionCandidate|null}
 */
export function decideByUtility(candidates) {
  const winner = pickByUtility(candidates);
  if (winner) winner.dispatch();
  return winner;
}

/**
 * 给候选 action 计算"权重 × 多怪 multiplier"——OFC/FRD 这类全体伤害的常见 score 计算。
 * @param {number} baseScore
 * @param {number} aliveCount
 * @returns {number}
 */
export function aoeScore(baseScore, aliveCount) {
  return baseScore * Math.max(1, aliveCount);
}
