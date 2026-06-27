// T1：药品恢复量自学。
// 喝药前记录 HP/MP/SP 绝对值 → 下回合 snapshot 入口取 delta → EWMA 更新该 potion ID 的实际恢复量。
// 抗扰动：负 delta 丢弃（怪物攻击/regen 干扰）；EWMA alpha 自适应保收敛。
//
// 数据流：
//   turn N 喝药 → recordPreDrink(potionId, snap)        [写 g("learnPending")]
//   turn N+1 snapshot → finalizePending(snap)            [读 pending → 计算 delta → 更新 learned]
//   后续决策 getLearnedRecovery(potionId) 优先返学到值，缺省 fallback POTION_RECOVERY
import { g } from "./store.js";
import { setValue, getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { POTION_RECOVERY } from "../battle/potion-economy.js";

/**
 * 喝药前调用：保存 pending 观测点。
 * @param {number|string} potionId
 * @param {import("../core/types.js").BattleSnapshot} snap
 */
export function recordPreDrink(potionId, snap) {
  const info = POTION_RECOVERY[parseInt(potionId)];
  if (!info) return; // 非药品（Health Gem 等）不学
  g("learnPending", {
    potionId: parseInt(potionId),
    stat: info.stat,
    pre: snap[`${info.stat}Abs`],
    turn: g("turn") || 0,
  });
}

/**
 * snapshot 入口调用：若有 pending 且非同回合 → 取 delta 更新 learned。
 * 同回合 click 后立刻 collect snapshot 也 OK（pending.turn === current turn 视为未结算，跳过）。
 * @param {import("../core/types.js").BattleSnapshot} snap
 */
export function finalizePending(snap) {
  const pending = g("learnPending");
  if (!pending) return;
  const curTurn = g("turn") || 0;
  if (curTurn === pending.turn) return; // 同回合，未结算
  const post = snap[`${pending.stat}Abs`];
  const delta = post - pending.pre;
  g("learnPending", null); // 清 pending
  if (delta <= 0) {
    // 怪物攻击/regen 干扰，不可信，丢弃
    if (g("option")?.dynamicHealLog) {
      console.log(
        `[recovery-learn] discard ${pending.potionId}: delta=${delta.toFixed(0)} (interference)`
      );
    }
    return;
  }
  updateLearned(pending.potionId, delta);
}

function updateLearned(potionId, observedDelta) {
  const learned = getValue(STORAGE_KEYS.LEARNED_RECOVERY, true) || {};
  const prior = learned[potionId];
  const n = (prior?.n ?? 0) + 1;
  const priorAmt = prior?.amount ?? POTION_RECOVERY[potionId]?.amount ?? observedDelta;
  // EWMA：n 越大 alpha 越小（趋稳），但下限 0.1 保对装备变化敏感
  const alpha = Math.max(0.1, 1 / n);
  const newAmt = priorAmt * (1 - alpha) + observedDelta * alpha;
  learned[potionId] = { amount: newAmt, n };
  setValue(STORAGE_KEYS.LEARNED_RECOVERY, learned);
  if (g("option")?.dynamicHealLog) {
    console.log(
      `[recovery-learn] ${potionId}: delta=${observedDelta.toFixed(0)} → learned=${newAmt.toFixed(0)} (n=${n})`
    );
  }
}

/**
 * 获取该 potion ID 的实际恢复量（学到的优先；未学到 fallback hardcoded prior）。
 * @param {number|string} potionId
 * @returns {{stat:string, amount:number}|null}
 */
export function getLearnedRecovery(potionId) {
  const id = parseInt(potionId);
  const fallback = POTION_RECOVERY[id];
  if (!fallback) return null;
  const learned = getValue(STORAGE_KEYS.LEARNED_RECOVERY, true) || {};
  if (learned[id] && learned[id].n > 0) {
    return { stat: fallback.stat, amount: learned[id].amount };
  }
  return fallback;
}
