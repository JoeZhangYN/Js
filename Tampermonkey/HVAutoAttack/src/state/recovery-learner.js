// T1：药品恢复量自学。
// 喝药前记录 HP/MP/SP 绝对值 → 下回合 snapshot 入口取 recoveryAbs delta → EWMA 更新该 potion ID 的实际恢复量。
// 抗扰动：负 delta 丢弃（怪物攻击/regen 干扰）；EWMA alpha 自适应保收敛。
//
// 数据流：
//   turn N 喝药 → recordPreDrink(potionId, recoveryAbs)  [写 g("learnPending")]
//   turn N+1 snapshot → finalizePending(recoveryAbs)      [读 pending → 计算 delta → 更新 learned]
//   后续决策 getLearnedRecovery(potionId) 优先返学到值，缺省 fallback RECOVERY_PRIOR
import { g } from "./store.js";
import { OptionEvent, runOptionAutomation } from "./option.js";
import { setValue, getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "./battle-turn.js";

const EVENT_RECORD_PRE_DRINK = "recordPreDrink";
const EVENT_FINALIZE_PENDING = "finalizePending";
const EVENT_READ_RECOVERY = "readRecovery";

export const RecoveryLearningEvent = Object.freeze({
  RECORD_PRE_DRINK: EVENT_RECORD_PRE_DRINK,
  FINALIZE_PENDING: EVENT_FINALIZE_PENDING,
  READ_RECOVERY: EVENT_READ_RECOVERY,
});

const RECOVERY_PRIOR = Object.freeze({
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

function isDynamicHealLogEnabled() {
  return Boolean(
    runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "dynamicHealLog",
      fallback: false,
    })
  );
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeTurn(value) {
  return Math.max(0, Math.trunc(normalizeNumber(value)));
}

function normalizePotionId(value) {
  const id = Number.parseInt(value, 10);
  return RECOVERY_PRIOR[id] ? id : null;
}

function normalizePending(value) {
  const potionId = normalizePotionId(value?.potionId);
  if (!potionId) return null;
  const stat = RECOVERY_PRIOR[potionId].stat;
  return {
    potionId,
    stat,
    pre: normalizeNumber(value?.pre),
    turn: normalizeTurn(value?.turn),
  };
}

function normalizeRecoveryAbs(value) {
  return {
    hp: normalizeNumber(value?.hp),
    mp: normalizeNumber(value?.mp),
    sp: normalizeNumber(value?.sp),
  };
}

function normalizeLearnedRecoveryRecord(value) {
  const amount = Number(value?.amount);
  const n = Number(value?.n);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(n) || n <= 0) return null;
  return {
    amount,
    n: Math.trunc(n),
  };
}

function readLearnedRecoveryMap() {
  const source = getValue(STORAGE_KEYS.LEARNED_RECOVERY, true) || {};
  const learned = {};
  for (const key of Object.keys(source)) {
    const potionId = normalizePotionId(key);
    const record = normalizeLearnedRecoveryRecord(source[key]);
    if (potionId && record) learned[potionId] = record;
  }
  return learned;
}

/**
 * 喝药前调用：保存 pending 观测点。
 * @param {number|string} potionId
 */
function recordPreDrink(potionId, recoveryAbs) {
  const id = normalizePotionId(potionId);
  const info = RECOVERY_PRIOR[id];
  if (!info) return;
  g(
    "learnPending",
    normalizePending({
      potionId: id,
      pre: normalizeRecoveryAbs(recoveryAbs)[info.stat],
      turn: runBattleTurnAutomation({ type: BattleTurnEvent.READ_CURRENT }),
    })
  );
}

/**
 * snapshot 入口调用：若有 pending 且非同回合 → 取 delta 更新 learned。
 * 同回合 click 后立刻 collect snapshot 也 OK（pending.turn === current turn 视为未结算，跳过）。
 * @param {{recoveryAbs?:{hp?:number,mp?:number,sp?:number}}} event
 */
function finalizePending(event) {
  const rawPending = g("learnPending");
  const pending = normalizePending(rawPending);
  if (!pending) {
    if (rawPending) g("learnPending", null);
    return;
  }
  const curTurn = normalizeTurn(runBattleTurnAutomation({ type: BattleTurnEvent.READ_CURRENT }));
  if (curTurn === pending.turn) {
    g("learnPending", pending);
    return; // 同回合，未结算
  }
  const post = normalizeRecoveryAbs(event?.recoveryAbs)[pending.stat];
  const delta = post - pending.pre;
  g("learnPending", null); // 清 pending
  if (delta <= 0) {
    // 怪物攻击/regen 干扰，不可信，丢弃
    if (isDynamicHealLogEnabled()) {
      console.log(
        `[recovery-learn] discard ${pending.potionId}: delta=${delta.toFixed(0)} (interference)`
      );
    }
    return;
  }
  updateLearned(pending.potionId, delta);
}

function updateLearned(potionId, observedDelta) {
  const learned = readLearnedRecoveryMap();
  const prior = learned[potionId];
  const n = (prior?.n ?? 0) + 1;
  const priorAmt = prior?.amount ?? RECOVERY_PRIOR[potionId]?.amount ?? observedDelta;
  // EWMA：n 越大 alpha 越小（趋稳），但下限 0.1 保对装备变化敏感
  const alpha = Math.max(0.1, 1 / n);
  const newAmt = priorAmt * (1 - alpha) + observedDelta * alpha;
  learned[potionId] = { amount: newAmt, n };
  setValue(STORAGE_KEYS.LEARNED_RECOVERY, learned);
  if (isDynamicHealLogEnabled()) {
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
function getLearnedRecovery(potionId) {
  const id = normalizePotionId(potionId);
  const fallback = RECOVERY_PRIOR[id];
  if (!fallback) return null;
  const learned = readLearnedRecoveryMap();
  if (learned[id]?.n > 0) return { stat: fallback.stat, amount: learned[id].amount };
  return fallback;
}

export function runRecoveryLearningAutomation(event = { type: EVENT_READ_RECOVERY }) {
  if (event.type === EVENT_RECORD_PRE_DRINK)
    return recordPreDrink(event.potionId, event.recoveryAbs);
  if (event.type === EVENT_FINALIZE_PENDING) return finalizePending(event);
  if (event.type === EVENT_READ_RECOVERY) return getLearnedRecovery(event.potionId);
  return undefined;
}
