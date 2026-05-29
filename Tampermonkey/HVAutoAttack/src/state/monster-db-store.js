// 怪物九抗本地库：IndexedDB 存储。
// 为何不用 GM_setValue：全量库可达数 MB（上游 persistent.json 数万条怪），
// GM 存大单值会卡且每次读写全量序列化 → 用 IndexedDB 按 key 随机存取。
// key = monsterName（HVAutoAttack 战斗中 snapshot 已直接采怪名，省掉 SukkaW 的 name→id 两跳）。
// 主世界 / isekai 分库（两套抗性数据不同）。
import { isIsekai } from "../env.js";

const DB_NAME = isIsekai ? "hvAA_monsterdb_isekai" : "hvAA_monsterdb";
const DB_VERSION = 1;
const STORE_MONSTERS = "monsters";
const STORE_META = "meta";

/** @type {Promise<IDBDatabase>|null} */
let dbPromise = null;

/** 打开（或建）库，单例 Promise。 */
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_MONSTERS)) {
        db.createObjectStore(STORE_MONSTERS); // out-of-line key：put 显式传 monsterName
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
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
 * 按怪名查九抗（不存在返回 null）。
 * @param {string} name
 * @returns {Promise<import("../data/monster-db.js").MonsterInfo|null>}
 */
export function getMonster(name) {
  return withStore(STORE_MONSTERS, "readonly", (s) => s.get(name)).then(
    (v) => v ?? null
  );
}

/**
 * 写入单只怪（scan 自采）。
 * @param {import("../data/monster-db.js").MonsterInfo} info
 */
export function setMonster(info) {
  return withStore(STORE_MONSTERS, "readwrite", (s) =>
    s.put(info, info.monsterName)
  );
}

/**
 * 批量写入（全量 JSON 下载）——单事务，避免逐条开销。
 * @param {import("../data/monster-db.js").MonsterInfo[]} infos
 */
export function bulkSetMonsters(infos) {
  return withStore(STORE_MONSTERS, "readwrite", (s) => {
    for (const info of infos) {
      if (info && info.monsterName) s.put(info, info.monsterName);
    }
  });
}

/** 读 meta（如 lastSync 日期）。 */
export function getMeta(key) {
  return withStore(STORE_META, "readonly", (s) => s.get(key)).then(
    (v) => v ?? null
  );
}

/** 写 meta。 */
export function setMeta(key, value) {
  return withStore(STORE_META, "readwrite", (s) => s.put(value, key));
}
