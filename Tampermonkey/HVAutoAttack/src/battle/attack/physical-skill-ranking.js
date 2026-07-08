// Physical skill ranking decision（OFC/FRD/T3/T2/T1）。
// 替代 first-match 优先级：枚举所有候选 skill 各自打分，取分数最高（且 > 0）的执行。
// 优势：能比较权衡（OFC vs FRD vs T3，分数化），不再死优先级；F (auto-tune) 后续可学权重。
//
// SkillCandidate 契约：
// - name: 日志用
// - score: ≥ 0；0 视为不可用；越高越好
// - dispatch: 若被选中调用此函数执行副作用
// - explain: 可选打分理由（debug 日志用）

import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../../core/diagnostic-console.js";

const EVENT_PICK_BY_UTILITY = "pick-by-utility";
const EVENT_AOE_SCORE = "aoe-score";

export const PhysicalSkillRankingEvent = Object.freeze({
  PICK_BY_UTILITY: EVENT_PICK_BY_UTILITY,
  AOE_SCORE: EVENT_AOE_SCORE,
});

const physicalSkillRankingEventHandlers = Object.freeze({
  [EVENT_PICK_BY_UTILITY]: (event) => pickByUtility(event.candidates || [], event.options || {}),
  [EVENT_AOE_SCORE]: (event) => aoeScore(event.baseScore, event.aliveCount),
});

/**
 * @typedef {object} SkillCandidate
 * @property {string} name
 * @property {number} score
 * @property {() => void} dispatch
 * @property {string} [explain]
 */

/**
 * PURE 选择：挑最高分（>0）候选并打日志，**不执行**（无 dispatch）。无可行候选返 null。
 * 供 decideAttack 物理技能分支复用（候选可为 {code,...} 或 {name,...}，日志取 name ?? code）。
 * @param {Array<{score:number, name?:string, code?:string, explain?:string}>} candidates
 * @param {{debugLog?: boolean}} options
 * @returns {object|null} 最高分候选（原对象）
 */
function pickByUtility(candidates, options = {}) {
  const valid = candidates.filter((c) => c && c.score > 0).sort((a, b) => b.score - a.score);
  if (valid.length === 0) return null;
  const winner = valid[0];
  if (options.debugLog) {
    const label = (c) => c.name ?? c.code;
    const runners = valid
      .slice(1, 3)
      .map((c) => `${label(c)}=${c.score.toFixed(0)}`)
      .join(", ");
    runDiagnosticConsoleAutomation({
      type: DiagnosticConsoleEvent.INFO,
      args: [
        `[physical-skill-ranking] ${label(winner)} score=${winner.score.toFixed(0)}${winner.explain ? " (" + winner.explain + ")" : ""}${runners ? ` vs [${runners}]` : ""}`,
      ],
    });
  }
  return winner;
}

/**
 * 给候选 action 计算"权重 × 多怪 multiplier"——OFC/FRD 这类全体伤害的常见 score 计算。
 * @param {number} baseScore
 * @param {number} aliveCount
 * @returns {number}
 */
function aoeScore(baseScore, aliveCount) {
  return baseScore * Math.max(1, aliveCount);
}

export function runPhysicalSkillRanking(event = { type: EVENT_PICK_BY_UTILITY }) {
  return physicalSkillRankingEventHandlers[event?.type]?.(event) ?? null;
}
