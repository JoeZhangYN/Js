// 怪物九抗全量库下载同步：从 SukkaW 社区数据库拉取，每日最多一次。
// 数据源：hv-monsterdb-data.skk.moe（明文 JSON 数组，MIT, Copyright (c) 2021 Sukka）。
// 跨域 GET 走统一 gmXhr（@connect 已放开该域）；失败保留旧库（空库不致命，靠 scan 自采补充）。
import { gmXhr } from "../dom/gm-xhr.js";
import { isIsekai } from "../env.js";
import { bulkSetMonsters, getMeta, setMeta, isProfileEmpty } from "../state/monster-db-store.js";
import { time } from "../core/time.js";

const DATA_URL = isIsekai
  ? "https://hv-monsterdb-data.skk.moe/isekai.json"
  : "https://hv-monsterdb-data.skk.moe/persistent.json";
const META_LAST_SYNC = "lastSync";

/** 从上游原始对象挑出 MonsterInfo 核心字段（丢弃 created_at 等冗余，统一与 scan 自采同形态）。 */
function normalize(m) {
  return {
    monsterId: m.monsterId, // 库主键（实测社区 JSON 含 `monsterId:84361`；旧 normalize 误丢）
    monsterName: m.monsterName,
    monsterClass: m.monsterClass,
    plvl: m.plvl,
    attack: m.attack,
    trainer: m.trainer,
    fire: m.fire, cold: m.cold, elec: m.elec, wind: m.wind,
    holy: m.holy, dark: m.dark,
    crushing: m.crushing, slashing: m.slashing, piercing: m.piercing,
    lastUpdate: m.lastUpdate,
  };
}

/**
 * 下载全量九抗库写入本地（每日最多一次）。失败保留旧库，永不抛。
 * @param {boolean} [force=false] 跳过每日 gate 强制刷新
 * @returns {Promise<{synced:boolean, count?:number, reason?:string}>}
 */
export async function syncMonsterDb(force = false) {
  if (!force) {
    const last = await getMeta(META_LAST_SYNC);
    // 每日 gate；但画像库为空（v2 升级后首次 / 新装）时绕过，立即重建——否则旧 lastSync 残留致
    // 空库等到明天才填。
    if (last === time(2) && !(await isProfileEmpty())) {
      return { synced: false, reason: "already-synced-today" };
    }
  }
  return new Promise((resolve) => {
    gmXhr({
      method: "GET",
      url: DATA_URL,
      responseType: "json",
      timeout: 30000,
      onload: (resp) => {
        let list = resp.response;
        if (!Array.isArray(list)) {
          try {
            list = JSON.parse(resp.responseText || "[]");
          } catch {
            resolve({ synced: false, reason: "parse-error" });
            return;
          }
        }
        if (!Array.isArray(list) || list.length === 0) {
          resolve({ synced: false, reason: "empty" });
          return;
        }
        Promise.resolve(bulkSetMonsters(list.map(normalize)))
          .then(() => setMeta(META_LAST_SYNC, time(2)))
          .then(() => resolve({ synced: true, count: list.length }))
          .catch(() => resolve({ synced: false, reason: "store-error" }));
      },
      onerror: () => resolve({ synced: false, reason: "network-error" }),
      ontimeout: () => resolve({ synced: false, reason: "timeout" }),
    });
  });
}
