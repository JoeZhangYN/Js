// IndexedDB concrete adapter. It owns database lifecycle, transaction completion and persisted
// failure evidence; business consumers only see MonsterDbStoreEvent decisions from the entry module.
import { StorageWriteOutcome } from "./storage-io-policy.js";
import { storageValueFingerprint } from "./storage-value.js";
import { selectChangedMonsterProfiles } from "./monster-db-content-diff.js";
import {
  MONSTER_DB_STORE_FAILURE_KEY,
  rejectMonsterDbStoreFailure,
} from "./monster-db-store-failure.js";

const DB_VERSION = 2;
const STORE_PROFILE = "monsterProfile";
const STORE_HP = "monsterHp";
const STORE_META = "meta";

export { MONSTER_DB_STORE_FAILURE_KEY };

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
        reject(rejectMonsterDbStoreFailure("open", { dbName, dbVersion: DB_VERSION }, req.error));
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
            reject(rejectMonsterDbStoreFailure("transaction-start", { storeName, mode }, error));
            return;
          }
          transaction.oncomplete = () => resolve(request ? request.result : undefined);
          transaction.onerror = () =>
            reject(
              rejectMonsterDbStoreFailure(
                "transaction-error",
                { storeName, mode },
                transaction.error
              )
            );
          transaction.onabort = () =>
            reject(
              rejectMonsterDbStoreFailure(
                "transaction-abort",
                { storeName, mode },
                transaction.error
              )
            );
        })
    );
  }

  function readProfile(monsterId) {
    return withStore(STORE_PROFILE, "readonly", (store) => store.get(monsterId)).then(
      (value) => value ?? null
    );
  }

  function writeProfile(info) {
    return writeProfiles([info]);
  }

  function writeProfiles(infos) {
    return withStore(STORE_PROFILE, "readwrite", (store) => {
      const outcome = { result: null };
      const request = store.getAll();
      request.onsuccess = () => {
        const diff = selectChangedMonsterProfiles(request.result || [], infos);
        for (const info of diff.changed) store.put(info, info.monsterId);
        outcome.result = {
          outcome:
            diff.changed.length > 0
              ? StorageWriteOutcome.WRITTEN
              : StorageWriteOutcome.SKIPPED_UNCHANGED,
          received: diff.received,
          written: diff.changed.length,
          unchanged: diff.unchanged,
        };
      };
      return outcome;
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
    if (monsterId == null || level == null || !(maxHP > 0)) {
      return Promise.resolve({ outcome: StorageWriteOutcome.SKIPPED_POLICY, written: 0 });
    }
    return writeIfChanged(STORE_HP, hpKey(monsterId, level), {
      monsterId,
      level,
      maxHP,
      lastUpdate,
    });
  }

  function readMeta(key) {
    return withStore(STORE_META, "readonly", (store) => store.get(key)).then(
      (value) => value ?? null
    );
  }

  function writeMeta(key, value) {
    return writeIfChanged(STORE_META, key, value);
  }

  function writeIfChanged(storeName, key, value) {
    return withStore(storeName, "readwrite", (store) => {
      const outcome = { result: null };
      const request = store.get(key);
      request.onsuccess = () => {
        const changed = storageValueFingerprint(request.result) !== storageValueFingerprint(value);
        if (changed) store.put(value, key);
        outcome.result = {
          outcome: changed ? StorageWriteOutcome.WRITTEN : StorageWriteOutcome.SKIPPED_UNCHANGED,
          written: changed ? 1 : 0,
        };
      };
      return outcome;
    });
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
