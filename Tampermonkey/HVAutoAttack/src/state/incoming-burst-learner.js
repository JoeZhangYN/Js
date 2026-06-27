// F5：进场爆发/致死伤害 + 类型学习器（默认 OFF）。从 player-incoming 战斗日志事件学每只怪(按 MID)的
// 「单发最大伤害 + 该最大伤害的类型」= 致死伤害天花板。决策层据此对高爆发怪单点 Silence/Sleep 防血量蹦极。
//
// 运行 max（非 EWMA）：战斗日志累积无回合界，单发 max 由全量日志重算即幂等；persist 跨战斗 → 固定竞技场
// 同 MID 复现直接命中。随等级提升怪变强 → max 自然上涨（保守 over-protect 是防守安全方向）。
// 类型决定控制选择：Silence 只挡施法(对物理无效)，故法术爆发→Silence、物理→Sleep（整回合禁用）。
import { setValue, getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { normalizeMonsterName } from "../battle/log-parser.js";

const EVENT_RECORD_EVENTS = "recordEvents";
const EVENT_READ_MAP = "readMap";

export const IncomingBurstLearningEvent = Object.freeze({
  RECORD_EVENTS: EVENT_RECORD_EVENTS,
  READ_MAP: EVENT_READ_MAP,
});

/**
 * 从本回合全量 DamageEvent[] 更新每 MID 的单发最大伤害 + 类型（运行 max，幂等）。
 * @param {Array<{kind:string,source:string,dmg:number,type:string}>} events
 * @param {Array<{monsterId?:number,name?:string}>} monsterStatus 名→MID 映射源
 */
function updateBurstFromEvents(events, monsterStatus) {
  if (!events || !events.length) return;
  const nameToMid = {};
  for (const st of monsterStatus || []) {
    if (st?.monsterId != null && st?.name) nameToMid[normalizeMonsterName(st.name)] = st.monsterId;
  }
  const learned = getValue(STORAGE_KEYS.LEARNED_INCOMING_BURST, true) || {};
  let changed = false;
  for (const e of events) {
    if (e.kind !== "player-incoming" || !(e.dmg > 0)) continue;
    const mid = nameToMid[normalizeMonsterName(e.source)];
    if (mid == null) continue; // 无法定位 MID（与 decide 的 MID lookup 对齐）→ 跳
    const rec = learned[mid];
    if (!rec || e.dmg > rec.maxHit) {
      learned[mid] = { maxHit: e.dmg, type: e.type || "unknown" };
      changed = true;
    }
  }
  if (changed) setValue(STORAGE_KEYS.LEARNED_INCOMING_BURST, learned);
}

/** 取全量学习表（snapshot attach 给 decide，保 decide PURE 不读 storage）。 */
function getLearnedBurstMap() {
  return getValue(STORAGE_KEYS.LEARNED_INCOMING_BURST, true) || {};
}

export function runIncomingBurstLearningAutomation(event = { type: EVENT_READ_MAP }) {
  if (event.type === EVENT_RECORD_EVENTS) return updateBurstFromEvents(event.events, event.monsterStatus);
  if (event.type === EVENT_READ_MAP) return getLearnedBurstMap();
  return undefined;
}
