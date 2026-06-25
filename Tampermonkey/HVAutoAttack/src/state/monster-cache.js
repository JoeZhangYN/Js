// 怪物库内存缓存（路径 B）：让同步的 collectSnapshot 能 join monster-db，而不必把主循环改 async。
// 数据源 = monster-db-store.js 的 IndexedDB（异步）。预取时机复用 resist-panel 每轮的怪名遍历
// （renderResistPanel，async 边界），把当前战场怪的库记录拉进内存；collectSnapshot(同步) 经
// getCachedDb() 读快照供 joinMonsterView。
// 缓存跨轮累积不清空：抗性/plvl/maxHP 是怪的静态属性（按 name），同名怪跨轮一致，旧值可复用。
// 新怪首轮首 turn 可能 race 输（prime async 未完成 → 该怪降级 db=null，次 turn 即补）；决策影响小：
// autoElement 默认关、Drain 用 hpAbsNow 不依赖 db。本轮中途新 scan 的怪由 setCachedMonster 即时补（消 R2）。
import { getMonster } from "./monster-db-store.js";

/** @type {Map<string, import("../data/monster-db.js").MonsterInfo|null>} */
const _cache = new Map();

/**
 * 预取一批怪名的库记录进内存（去重；并发 getMonster）。永不抛（单条失败存 null）。
 * @param {string[]} names 当前战场怪名
 * @returns {Promise<void>}
 */
export async function primeMonsterCache(names) {
  const uniq = [...new Set((names || []).filter(Boolean))];
  await Promise.all(
    uniq.map(async (name) => {
      try {
        _cache.set(name, await getMonster(name));
      } catch {
        _cache.set(name, null);
      }
    })
  );
}

/**
 * 同步读单只怪的库记录（未预取 → null）。
 * @param {string} name
 * @returns {import("../data/monster-db.js").MonsterInfo|null}
 */
export function getCachedMonster(name) {
  return _cache.get(name) ?? null;
}

/**
 * 同步取整个缓存快照（怪名 → 库记录），供 joinMonsterView 的 dbByName。
 * @returns {Record<string, import("../data/monster-db.js").MonsterInfo|null>}
 */
export function getCachedDb() {
  return Object.fromEntries(_cache);
}

/**
 * 即时写入单只怪（scan 入库后调用，消本轮中途新 scan 怪的新鲜度缺口 R2）。
 * @param {string} name
 * @param {import("../data/monster-db.js").MonsterInfo} info
 */
export function setCachedMonster(name, info) {
  if (name) _cache.set(name, info);
}

/** 测试用：清空缓存。 */
export function _clearMonsterCache() {
  _cache.clear();
}
