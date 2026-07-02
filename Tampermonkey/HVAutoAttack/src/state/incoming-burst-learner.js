// F5：进场爆发/致死伤害 + 类型学习器（默认 OFF）。从 player-incoming 战斗日志事件学每只怪(按 MID)的
// 「单发最大伤害 + 该最大伤害的类型」= 致死伤害天花板。决策层据此对高爆发怪单点 Silence/Sleep 防血量蹦极。
//
// 运行 max（非 EWMA）：战斗日志累积无回合界，单发 max 由全量日志重算即幂等；persist 跨战斗 → 固定竞技场
// 同 MID 复现直接命中。随等级提升怪变强 → max 自然上涨（保守 over-protect 是防守安全方向）。
// 类型决定控制选择：Silence 只挡施法(对物理无效)，故法术爆发→Silence、物理→Sleep（整回合禁用）。
import { getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { normalizeMonsterName } from "../monster/monster-identity.js";
import { persistLearnedIncomingBurst } from "./incoming-burst-learner-failure.js";

const EVENT_RECORD_EVENTS = "recordEvents";
const EVENT_READ_MAP = "readMap";

export const IncomingBurstLearningEvent = Object.freeze({
  RECORD_EVENTS: EVENT_RECORD_EVENTS,
  READ_MAP: EVENT_READ_MAP,
});

function normalizePositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizeMonsterId(value) {
  const number = normalizePositiveNumber(value);
  return number == null ? null : Math.trunc(number);
}

function normalizeDamageType(value) {
  return typeof value === "string" && value ? value : "unknown";
}

function normalizeLearnedBurstRecord(value) {
  const maxHit = normalizePositiveNumber(value?.maxHit);
  if (maxHit == null) return null;
  return { maxHit, type: normalizeDamageType(value?.type) };
}

function readLearnedBurstMap() {
  const source = getValue(STORAGE_KEYS.LEARNED_INCOMING_BURST, true) || {};
  const learned = {};
  for (const mid of Object.keys(source)) {
    const normalizedMid = normalizeMonsterId(mid);
    const record = normalizeLearnedBurstRecord(source[mid]);
    if (normalizedMid != null && record) learned[normalizedMid] = record;
  }
  return learned;
}

/**
 * 从本回合全量 DamageEvent[] 更新每 MID 的单发最大伤害 + 类型（运行 max，幂等）。
 * @param {Array<{kind:string,source:string,dmg:number,type:string}>} events
 * @param {Array<{monsterId?:number,name?:string}>} monsterIdentities 名→MID 映射源
 */
function updateBurstFromEvents(events, monsterIdentities) {
  if (!events || !events.length) return;
  const nameToMid = {};
  for (const identity of monsterIdentities || []) {
    const mid = normalizeMonsterId(identity?.monsterId);
    if (mid != null && identity?.name) nameToMid[normalizeMonsterName(identity.name)] = mid;
  }
  const learned = readLearnedBurstMap();
  let changed = false;
  for (const e of events) {
    const dmg = normalizePositiveNumber(e.dmg);
    if (e.kind !== "player-incoming" || dmg == null) continue;
    const mid = nameToMid[normalizeMonsterName(e.source)];
    if (mid == null) continue; // 无法定位 MID（与 decide 的 MID lookup 对齐）→ 跳
    const rec = learned[mid];
    if (!rec || dmg > rec.maxHit) {
      learned[mid] = { maxHit: dmg, type: normalizeDamageType(e.type) };
      changed = true;
    }
  }
  if (changed) return persistLearnedIncomingBurst(learned);
  return undefined;
}

/** 取全量学习表（snapshot attach 给 decide，保 decide PURE 不读 storage）。 */
function getLearnedBurstMap() {
  return readLearnedBurstMap();
}

const incomingBurstLearningEventHandlers = Object.freeze({
  [EVENT_RECORD_EVENTS]: (event) => updateBurstFromEvents(event.events, event.monsterIdentities),
  [EVENT_READ_MAP]: () => getLearnedBurstMap(),
});

export function runIncomingBurstLearningAutomation(event = { type: EVENT_READ_MAP }) {
  return incomingBurstLearningEventHandlers[event?.type]?.(event);
}
