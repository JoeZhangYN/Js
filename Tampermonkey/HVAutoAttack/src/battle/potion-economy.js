// PoC：药品经济学。避免"喝药满血溢出"浪费 + 拖战策略。
// HV 药品恢复量为定值（不是 %）→ 喝药时若 deficit < 恢复量 × 容差，溢出=浪费。

/**
 * 药品 ID → 估计单次恢复绝对值（HP/MP/SP）。
 * 数值是 mid-tier 玩家保守估计的 local fallback；battle decisions should inject
 * state/recovery-learner.js READ_RECOVERY so learned recovery remains the business answer.
 */
const POTION_RECOVERY = Object.freeze({
  // Health
  11191: { stat: "hp", amount: 200 }, // Health Draught
  11195: { stat: "hp", amount: 400 }, // Health Potion
  11199: { stat: "hp", amount: 800 }, // Health Elixir
  // Mana
  11291: { stat: "mp", amount: 50 }, // Mana Draught
  11295: { stat: "mp", amount: 100 }, // Mana Potion
  11299: { stat: "mp", amount: 200 }, // Mana Elixir
  // Spirit
  11391: { stat: "sp", amount: 80 }, // Spirit Draught
  11395: { stat: "sp", amount: 160 }, // Spirit Potion
  11399: { stat: "sp", amount: 320 }, // Spirit Elixir
});

/**
 * 喝药是否浪费（deficit 不够大）。
 * 优先用 recovery-learner 学到的 amount，缺省 fallback hardcoded。
 * @param {number|string} potionId
 * @param {{hpDeficit:number,mpDeficit:number,spDeficit:number}} snap
 * @param {number} tolerance 0..1 容差，0.7=允许 30% 溢出
 * @param {(id:number)=>{stat:string,amount:number}|null} [getRecovery] 注入查询函数（默认查 POTION_RECOVERY）
 */
export function isPotionWasteful(potionId, snap, tolerance = 0.7, getRecovery) {
  const info = getRecovery ? getRecovery(parseInt(potionId)) : POTION_RECOVERY[parseInt(potionId)];
  if (!info) return false;
  const deficit = snap[`${info.stat}Deficit`] || 0;
  return deficit < info.amount * tolerance;
}

/**
 * 拖战 (stall) 判断：拖时间让资源回流，下场战斗用满 OC + MP + SP 开局。
 *
 * 触发条件（4 合 1）：
 *  1. 不是最后一轮（roundNow < roundAll，后面还有战斗值得攒资源）
 *  2. 仅剩 1 怪存活
 *  3. 怪还活着且 hpRatio 足够高（避免在 monster 即将被秒杀的回合白拖）
 *  4. OC 没满（< 250），有继续刷的空间
 *
 * @param {import("../core/types.js").BattleSnapshot} snap
 * @param {object} opt battle rule option subset
 * @returns {boolean}
 */
export function isStallMode(snap, opt, roundNow, roundAll) {
  if (opt.stallMode === false) return false;
  if (!roundNow || !roundAll || roundNow >= roundAll) return false;
  const alive = snap.view.filter((m) => !m.isDead);
  if (alive.length !== 1) return false;
  if (alive[0].hpPercent < 0.3) return false; // 已经残血，秒了算了
  if ((snap.oc || 0) >= 250) return false; // OC 已满，没必要再拖
  return true;
}

/**
 * Stall 模式专属：**仅 Draught**（Replenishment 慢回 buff），百分比控制。
 * 理由：百分比对各装备最大 MP/SP 都有意义；absolute deficit 在大 max 时小缺口就误触。
 * - mpFloor / spFloor 默认 70%——MP/SP 低于此值时才喝
 * - 已有 Replenishment / spiritpot buff 时不重复喝
 *
 * Mana Draught 11291 → "manapot" img / Spirit Draught 11391 → "spiritpot" img
 */
export function stallTopupCandidates(snap, opt = {}) {
  const candidates = [];
  const mpFloor = opt.stallTopupMpFloor ?? 70;
  const spFloor = opt.stallTopupSpFloor ?? 70;
  if ((snap.mp ?? 100) < mpFloor && !snap.playerBuffs.includes("manapot")) {
    candidates.push(11291);
  }
  if ((snap.sp ?? 100) < spFloor && !snap.playerBuffs.includes("spiritpot")) {
    candidates.push(11391);
  }
  return candidates;
}
