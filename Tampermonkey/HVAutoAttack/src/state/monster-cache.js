// 怪物画像内存缓存（路径 B）：让同步的 collectSnapshot 能 join monster-db，而不必把主循环改 async。
// **键 = monsterId(全局 MID)**（库已改 MID 主键）。MID 来自开局 spawn 行 → monsterStatus.monsterId。
// 数据源 = monster-db-store.js 的 IndexedDB（异步）。预取时机复用 resist-panel 每轮的怪遍历
// （renderResistPanel，async 边界）；collectSnapshot(同步) 经 getCachedDb() 读快照供 joinMonsterView。
// 缓存跨轮累积不清空：抗性/plvl 是怪静态属性（按 MID），同 MID 跨轮一致，旧值可复用。
// 新怪首轮首 turn 可能 race 输（prime async 未完成 → 该怪降级 db=null，次 turn 即补）；决策影响小：
// autoElement 默认关、Drain 用 hpAbsNow 不依赖 db。本轮中途新 scan 的怪由 setCachedMonster 即时补。
import {
  MonsterDbStoreEvent,
  runMonsterDbStoreAutomation,
} from "./monster-db-store.js";

/** @type {Map<number, import("../data/monster-db.js").MonsterInfo|null>} */
const _cache = new Map();

/**
 * 预取一批 MID 的画像进内存（去重；并发读取 store entry）。永不抛（单条失败存 null）。
 * @param {Array<number|undefined|null>} monsterIds 当前战场怪的 MID（来自 monsterStatus.monsterId）
 * @returns {Promise<void>}
 */
export async function primeMonsterCache(monsterIds) {
  const uniq = [...new Set((monsterIds || []).filter((id) => id != null))];
  await Promise.all(
    uniq.map(async (id) => {
      try {
        _cache.set(
          id,
          await runMonsterDbStoreAutomation({
            type: MonsterDbStoreEvent.PROFILE_READ,
            monsterId: id,
          })
        );
      } catch {
        _cache.set(id, null);
      }
    })
  );
}

/**
 * 同步读单只怪画像（未预取 / 无 MID → null）。
 * @param {number|undefined|null} monsterId
 * @returns {import("../data/monster-db.js").MonsterInfo|null}
 */
export function getCachedMonster(monsterId) {
  return (monsterId != null && _cache.get(monsterId)) || null;
}

/**
 * 同步取整个缓存快照（MID → 画像），供 joinMonsterView 的 dbById。
 * @returns {Record<number, import("../data/monster-db.js").MonsterInfo|null>}
 */
export function getCachedDb() {
  return Object.fromEntries(_cache);
}

/**
 * 即时写入单只怪（scan 入库后调用，消本轮中途新 scan 怪的新鲜度缺口）。
 * @param {number} monsterId
 * @param {import("../data/monster-db.js").MonsterInfo} info
 */
export function setCachedMonster(monsterId, info) {
  if (monsterId != null) _cache.set(monsterId, info);
}

/** 测试用：清空缓存。 */
export function _clearMonsterCache() {
  _cache.clear();
}
