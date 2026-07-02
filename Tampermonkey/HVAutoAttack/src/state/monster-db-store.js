// 怪物本地库：IndexedDB 存储。**主键 = monsterId(全局 MID)**（不再按怪名——同名怪可属不同
// trainer = 不同 MID = 不同抗性/血量，按名存会互相覆盖）。怪名→MID 由战场 spawn 行 / scan 时
// 从 monsterStatus 解析（见 battle/log-parser, monster-db-scan）。
// 为何不用 GM_setValue：全量库可达数 MB → IndexedDB 按 key 随机存取。
// 主世界 / isekai 分库（两套数据不同）。
//
// 双 store（用户定的两表结构）：
//   - monsterProfile (key=monsterId)        抗性 + 身份 + scan 实测战斗参数（社区同步 + scan 自采）
//   - monsterHp      (key=`${monsterId}|${level}`) 满血(开局 spawn 行；LV 决定 HP，故 (MID,LV) 复合键)
import { isIsekai } from "../env.js";

const DB_NAME = isIsekai ? "hvAA_monsterdb_isekai" : "hvAA_monsterdb";
const DB_VERSION = 2; // v1→v2：弃旧 name 键 "monsters" store，改 monsterProfile(by MID) + 新 monsterHp
const STORE_PROFILE = "monsterProfile";
const STORE_HP = "monsterHp";
const STORE_META = "meta";
const EVENT_PROFILE_READ = "profileRead";
const EVENT_PROFILE_WRITE = "profileWrite";
const EVENT_PROFILE_BULK_WRITE = "profileBulkWrite";
const EVENT_PROFILE_IS_EMPTY = "profileIsEmpty";
const EVENT_HP_READ = "hpRead";
const EVENT_HP_WRITE = "hpWrite";
const EVENT_META_READ = "metaRead";
const EVENT_META_WRITE = "metaWrite";

export const MonsterDbStoreEvent = Object.freeze({
  PROFILE_READ: EVENT_PROFILE_READ,
  PROFILE_WRITE: EVENT_PROFILE_WRITE,
  PROFILE_BULK_WRITE: EVENT_PROFILE_BULK_WRITE,
  PROFILE_IS_EMPTY: EVENT_PROFILE_IS_EMPTY,
  HP_READ: EVENT_HP_READ,
  HP_WRITE: EVENT_HP_WRITE,
  META_READ: EVENT_META_READ,
  META_WRITE: EVENT_META_WRITE,
});

const monsterDbStoreEventHandlers = Object.freeze({
  [EVENT_PROFILE_READ]: (event) => getMonsterById(event.monsterId),
  [EVENT_PROFILE_WRITE]: (event) => setMonsterById(event.info),
  [EVENT_PROFILE_BULK_WRITE]: (event) => bulkSetMonsters(event.infos || []),
  [EVENT_PROFILE_IS_EMPTY]: () => isProfileEmpty(),
  [EVENT_HP_READ]: (event) => getMonsterHp(event.monsterId, event.level),
  [EVENT_HP_WRITE]: (event) => setMonsterHp(event.monsterId, event.level, event.maxHP, event.lastUpdate),
  [EVENT_META_READ]: (event) => getMeta(event.key),
  [EVENT_META_WRITE]: (event) => setMeta(event.key, event.value),
});

/** @type {Promise<IDBDatabase>|null} */
let dbPromise = null;

/** 打开（或建/升级）库，单例 Promise。 */
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // v1 旧 name 键库弃用（抗性库社区同步自愈 + scan 重扫即回；无法把无 MID 的旧记录安全迁移）
      if (db.objectStoreNames.contains("monsters")) db.deleteObjectStore("monsters");
      if (!db.objectStoreNames.contains(STORE_PROFILE)) db.createObjectStore(STORE_PROFILE); // key=monsterId
      if (!db.objectStoreNames.contains(STORE_HP)) db.createObjectStore(STORE_HP); // key=`${mid}|${lv}`
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/**
 * 在单事务内执行 fn，事务完成才 resolve。fn 可返回一个 IDBRequest（取其 result）或 void。
 * @template T
 * @param {string} storeName
 * @param {IDBTransactionMode} mode
 * @param {(store:IDBObjectStore)=>(IDBRequest|void)} fn
 * @returns {Promise<T|undefined>}
 */
function withStore(storeName, mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const r = fn(t.objectStore(storeName));
        t.oncomplete = () => resolve(r ? r.result : undefined);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

/**
 * 按 MID 查怪物画像（不存在返回 null）。
 * @param {number} monsterId
 * @returns {Promise<import("../data/monster-db.js").MonsterInfo|null>}
 */
function getMonsterById(monsterId) {
  return withStore(STORE_PROFILE, "readonly", (s) => s.get(monsterId)).then((v) => v ?? null);
}

/**
 * 写入单只怪画像（scan 自采 / 社区单条）。需带 monsterId，否则跳过（不可无键入库）。
 * @param {import("../data/monster-db.js").MonsterInfo} info
 */
function setMonsterById(info) {
  if (!info || info.monsterId == null) return Promise.resolve();
  return withStore(STORE_PROFILE, "readwrite", (s) => s.put(info, info.monsterId));
}

/**
 * 批量写画像（全量 JSON 下载）——单事务。丢无 monsterId 的脏行。
 * @param {import("../data/monster-db.js").MonsterInfo[]} infos
 */
function bulkSetMonsters(infos) {
  return withStore(STORE_PROFILE, "readwrite", (s) => {
    for (const info of infos) {
      if (info && info.monsterId != null) s.put(info, info.monsterId);
    }
  });
}

/** 画像库是否为空（升级后首次 → 触发强制重同步，绕过 lastSync 每日 gate）。 */
function isProfileEmpty() {
  return withStore(STORE_PROFILE, "readonly", (s) => s.count()).then((n) => !n);
}

const hpKey = (monsterId, level) => `${monsterId}|${level}`;

/**
 * 查 (MID, level) 满血（不存在返 null）。MID 唯一定位怪、LV 决定本场满血 → 复合键不跨等级误用。
 * @param {number} monsterId
 * @param {number} level
 * @returns {Promise<{monsterId:number, level:number, maxHP:number, lastUpdate?:string}|null>}
 */
function getMonsterHp(monsterId, level) {
  return withStore(STORE_HP, "readonly", (s) => s.get(hpKey(monsterId, level))).then((v) => v ?? null);
}

/**
 * 写 (MID, level)→满血（开局 spawn 行 / scan cur·max / 死亡反推）。需 MID+level，否则跳过。
 * @param {number} monsterId
 * @param {number} level
 * @param {number} maxHP
 * @param {string} [lastUpdate]
 */
function setMonsterHp(monsterId, level, maxHP, lastUpdate) {
  if (monsterId == null || level == null || !(maxHP > 0)) return Promise.resolve();
  return withStore(STORE_HP, "readwrite", (s) =>
    s.put({ monsterId, level, maxHP, lastUpdate }, hpKey(monsterId, level))
  );
}

/** 读 meta（如 lastSync 日期）。 */
function getMeta(key) {
  return withStore(STORE_META, "readonly", (s) => s.get(key)).then((v) => v ?? null);
}

/** 写 meta。 */
function setMeta(key, value) {
  return withStore(STORE_META, "readwrite", (s) => s.put(value, key));
}

export function runMonsterDbStoreAutomation(event = { type: EVENT_PROFILE_READ }) {
  return monsterDbStoreEventHandlers[event?.type]?.(event);
}
