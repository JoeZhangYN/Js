// 怪物画像、等级 HP 与同步元数据的唯一业务事件入口。
// 世界只在能力创建时选择数据库名；调用者使用完全相同的事件形状。
import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import {
  createMonsterDbIndexedDbAdapter,
  MONSTER_DB_STORE_FAILURE_KEY,
} from "./monster-db-store-indexeddb.js";

const EVENT_PROFILE_READ = "profileRead";
const EVENT_PROFILE_WRITE = "profileWrite";
const EVENT_PROFILE_BULK_WRITE = "profileBulkWrite";
const EVENT_PROFILE_IS_EMPTY = "profileIsEmpty";
const EVENT_HP_READ = "hpRead";
const EVENT_HP_WRITE = "hpWrite";
const EVENT_META_READ = "metaRead";
const EVENT_META_WRITE = "metaWrite";

export { MONSTER_DB_STORE_FAILURE_KEY };

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

export function createMonsterDbStoreCapability({ dbName }, deps = {}) {
  if (!dbName) throw new TypeError("Monster DB store capability requires a database name");
  const adapter = createMonsterDbIndexedDbAdapter({
    dbName,
    indexedDb: deps.indexedDb || globalThis.indexedDB,
  });
  const handlers = Object.freeze({
    [EVENT_PROFILE_READ]: (event) => adapter.readProfile(event.monsterId),
    [EVENT_PROFILE_WRITE]: (event) => adapter.writeProfile(event.info),
    [EVENT_PROFILE_BULK_WRITE]: (event) => adapter.writeProfiles(event.infos || []),
    [EVENT_PROFILE_IS_EMPTY]: () => adapter.isProfileEmpty(),
    [EVENT_HP_READ]: (event) => adapter.readHp(event.monsterId, event.level),
    [EVENT_HP_WRITE]: (event) =>
      adapter.writeHp(event.monsterId, event.level, event.maxHP, event.lastUpdate),
    [EVENT_META_READ]: (event) => adapter.readMeta(event.key),
    [EVENT_META_WRITE]: (event) => adapter.writeMeta(event.key, event.value),
  });
  return Object.freeze({
    run(event = { type: EVENT_PROFILE_READ }) {
      return handlers[event?.type]?.(event);
    },
  });
}

const currentMonsterDbStore = createMonsterDbStoreCapability({
  dbName: CURRENT_WORLD_POLICY.monsterKnowledge.dbName,
});

export function runMonsterDbStoreAutomation(event = { type: EVENT_PROFILE_READ }) {
  return currentMonsterDbStore.run(event);
}
