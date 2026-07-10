// IndexedDB concrete adapter. It owns database lifecycle, transaction completion and persisted
// failure evidence; business consumers only see MonsterDbStoreEvent decisions from the entry module.
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";

const DB_VERSION = 2;
const STORE_PROFILE = "monsterProfile";
const STORE_HP = "monsterHp";
const STORE_META = "meta";

export const MONSTER_DB_STORE_FAILURE_KEY = "HVAA:lastMonsterDbStoreFailure";

function classifyDbError(stage, detail, error) {
  return {
    capability: "monsterDbStore",
    source: "monsterDbStore",
    stage,
    ...detail,
    error: error?.message || error?.name || String(error || "unknown"),
  };
}

function rejectDbFailure(stage, detail, error) {
  const failure = classifyDbError(stage, detail, error);
  try {
    sessionStorage.setItem(MONSTER_DB_STORE_FAILURE_KEY, JSON.stringify(failure));
  } catch {
    // IndexedDB failure rejection must not depend on diagnostic storage.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] monster db store failed", failure],
  });
  const rejected = new Error(`monster db store ${stage} failed`);
  rejected.failure = failure;
  return rejected;
}

export function createMonsterDbIndexedDbAdapter({ dbName, indexedDb }) {
  /** @type {Promise<IDBDatabase>|null} */
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDb.open(dbName, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (db.objectStoreNames.contains("monsters")) db.deleteObjectStore("monsters");
        if (!db.objectStoreNames.contains(STORE_PROFILE)) db.createObjectStore(STORE_PROFILE);
        if (!db.objectStoreNames.contains(STORE_HP)) db.createObjectStore(STORE_HP);
        if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(rejectDbFailure("open", { dbName, dbVersion: DB_VERSION }, req.error));
      };
    });
    return dbPromise;
  }

  function withStore(storeName, mode, operation) {
    return openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          let transaction;
          let request;
          try {
            transaction = db.transaction(storeName, mode);
            request = operation(transaction.objectStore(storeName));
          } catch (error) {
            reject(rejectDbFailure("transaction-start", { storeName, mode }, error));
            return;
          }
          transaction.oncomplete = () => resolve(request ? request.result : undefined);
          transaction.onerror = () =>
            reject(rejectDbFailure("transaction-error", { storeName, mode }, transaction.error));
          transaction.onabort = () =>
            reject(rejectDbFailure("transaction-abort", { storeName, mode }, transaction.error));
        })
    );
  }

  function readProfile(monsterId) {
    return withStore(STORE_PROFILE, "readonly", (store) => store.get(monsterId)).then(
      (value) => value ?? null
    );
  }

  function writeProfile(info) {
    if (!info || info.monsterId == null) return Promise.resolve();
    return withStore(STORE_PROFILE, "readwrite", (store) => store.put(info, info.monsterId));
  }

  function writeProfiles(infos) {
    return withStore(STORE_PROFILE, "readwrite", (store) => {
      for (const info of infos) {
        if (info && info.monsterId != null) store.put(info, info.monsterId);
      }
    });
  }

  function isProfileEmpty() {
    return withStore(STORE_PROFILE, "readonly", (store) => store.count()).then((count) => !count);
  }

  const hpKey = (monsterId, level) => `${monsterId}|${level}`;

  function readHp(monsterId, level) {
    return withStore(STORE_HP, "readonly", (store) => store.get(hpKey(monsterId, level))).then(
      (value) => value ?? null
    );
  }

  function writeHp(monsterId, level, maxHP, lastUpdate) {
    if (monsterId == null || level == null || !(maxHP > 0)) return Promise.resolve();
    return withStore(STORE_HP, "readwrite", (store) =>
      store.put({ monsterId, level, maxHP, lastUpdate }, hpKey(monsterId, level))
    );
  }

  function readMeta(key) {
    return withStore(STORE_META, "readonly", (store) => store.get(key)).then(
      (value) => value ?? null
    );
  }

  function writeMeta(key, value) {
    return withStore(STORE_META, "readwrite", (store) => store.put(value, key));
  }

  return Object.freeze({
    readProfile,
    writeProfile,
    writeProfiles,
    isProfileEmpty,
    readHp,
    writeHp,
    readMeta,
    writeMeta,
  });
}
