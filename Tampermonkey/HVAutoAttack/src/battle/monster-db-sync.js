// 怪物九抗全量库下载同步：从 SukkaW 社区数据库拉取，每日最多一次。
// 数据源：hv-monsterdb-data.skk.moe（明文 JSON 数组，MIT, Copyright (c) 2021 Sukka）。
// 跨域 GET 走统一 gmXhr（@connect 已放开该域）；失败保留旧库（空库不致命，靠 scan 自采补充）。
import { gmXhr } from "../dom/gm-xhr.js";
import { isIsekai } from "../env.js";
import { MonsterDbStoreEvent, runMonsterDbStoreAutomation } from "../state/monster-db-store.js";
import { TimeEvent, runTimeAutomation } from "../core/time.js";

const DATA_URL = isIsekai
  ? "https://hv-monsterdb-data.skk.moe/isekai.json"
  : "https://hv-monsterdb-data.skk.moe/persistent.json";
const META_LAST_SYNC = "lastSync";
const EVENT_SYNC_REQUESTED = "syncRequested";

export const MonsterDbSyncEvent = Object.freeze({
  SYNC_REQUESTED: EVENT_SYNC_REQUESTED,
});

function makeDeps(deps) {
  return {
    storeProfiles:
      deps.storeProfiles ||
      ((infos) =>
        runMonsterDbStoreAutomation({
          type: MonsterDbStoreEvent.PROFILE_BULK_WRITE,
          infos,
        })),
    readMeta:
      deps.readMeta ||
      ((key) => runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.META_READ, key })),
    gmXhr: deps.gmXhr || gmXhr,
    profileIsEmpty:
      deps.profileIsEmpty ||
      (() => runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_IS_EMPTY })),
    writeMeta:
      deps.writeMeta ||
      ((key, value) =>
        runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.META_WRITE, key, value })),
    readUtcDateKey:
      deps.readUtcDateKey || (() => runTimeAutomation({ type: TimeEvent.UTC_DATE_KEY })),
  };
}

/** 从上游原始对象挑出 MonsterInfo 核心字段（丢弃 created_at 等冗余，统一与 scan 自采同形态）。 */
function normalize(m) {
  return {
    monsterId: m.monsterId, // 库主键（实测社区 JSON 含 `monsterId:84361`；旧 normalize 误丢）
    monsterName: m.monsterName,
    monsterClass: m.monsterClass,
    plvl: m.plvl,
    attack: m.attack,
    trainer: m.trainer,
    fire: m.fire,
    cold: m.cold,
    elec: m.elec,
    wind: m.wind,
    holy: m.holy,
    dark: m.dark,
    crushing: m.crushing,
    slashing: m.slashing,
    piercing: m.piercing,
    lastUpdate: m.lastUpdate,
  };
}

function errorText(error) {
  return error?.message || error?.name || String(error || "unknown");
}

function classifySyncFailure(stage, reason, detail = {}, error) {
  const failure = { source: "monsterDbSync", stage, reason, url: DATA_URL, ...detail };
  if (error?.failure) failure.cause = error.failure;
  if (error) failure.error = errorText(error);
  return failure;
}

function syncRejected(stage, reason, detail, error) {
  return { synced: false, reason, failure: classifySyncFailure(stage, reason, detail, error) };
}

/**
 * 下载全量九抗库写入本地（每日最多一次）。失败保留旧库，永不抛。
 * @param {boolean} [force=false] 跳过每日 gate 强制刷新
 * @returns {Promise<{synced:boolean, count?:number, reason?:string}>}
 */
async function syncMonsterDb({ force = false, deps }) {
  if (!force) {
    const last = await deps.readMeta(META_LAST_SYNC);
    // 每日 gate；但画像库为空（v2 升级后首次 / 新装）时绕过，立即重建——否则旧 lastSync 残留致
    // 空库等到明天才填。
    if (last === deps.readUtcDateKey() && !(await deps.profileIsEmpty())) {
      return { synced: false, reason: "already-synced-today" };
    }
  }
  return new Promise((resolve) => {
    try {
      deps.gmXhr({
        method: "GET",
        url: DATA_URL,
        responseType: "json",
        timeout: 30000,
        onload: async (resp) => {
          let list = resp.response;
          if (!Array.isArray(list)) {
            try {
              list = JSON.parse(resp.responseText || "[]");
            } catch (error) {
              resolve(syncRejected("parse", "parse-error", {}, error));
              return;
            }
          }
          if (!Array.isArray(list) || list.length === 0) {
            resolve(
              syncRejected("validate", "empty", { length: Array.isArray(list) ? list.length : null })
            );
            return;
          }
          try {
            await deps.storeProfiles(list.map(normalize));
          } catch (error) {
            resolve(syncRejected("store-profiles", "store-error", { count: list.length }, error));
            return;
          }
          try {
            await deps.writeMeta(META_LAST_SYNC, deps.readUtcDateKey());
          } catch (error) {
            resolve(syncRejected("write-meta", "store-error", { key: META_LAST_SYNC }, error));
            return;
          }
          resolve({ synced: true, count: list.length });
        },
        onerror: (error) => resolve(syncRejected("network", "network-error", {}, error)),
        ontimeout: (error) => resolve(syncRejected("timeout", "timeout", {}, error)),
      });
    } catch (error) {
      resolve(syncRejected("request-start", "network-error", {}, error));
    }
  });
}

const monsterDbSyncEventHandlers = Object.freeze({
  [EVENT_SYNC_REQUESTED]: (event, deps) =>
    syncMonsterDb({ force: Boolean(event.force), deps: makeDeps(deps) }),
});

export function runMonsterDbSyncAutomation(event = { type: EVENT_SYNC_REQUESTED }, deps = {}) {
  return monsterDbSyncEventHandlers[event?.type]?.(event, deps);
}
