// scan 自采：监听战斗日志，玩家 scan 怪物时解析九抗写入本地库，补充全量库未覆盖的新怪。
// SHELL：MutationObserver 副作用 + DOM 读取；解析/校验委托纯函数 data/monster-db.js。
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { time } from "../core/time.js";
import { parseScanResult, checkScanResultValidity } from "../data/monster-db.js";
import {
  MonsterDbStoreEvent,
  runMonsterDbStoreAutomation,
} from "../state/monster-db-store.js";
import { MonsterCacheEvent, runMonsterCacheAutomation } from "../state/monster-cache.js";

const EVENT_START = "start";

export const MonsterScanLearningEvent = Object.freeze({
  START: EVENT_START,
});

function makeDeps(deps) {
  return {
    checkScanResultValidity: deps.checkScanResultValidity || checkScanResultValidity,
    g: deps.g || g,
    gE: deps.gE || gE,
    MutationObserver: deps.MutationObserver || MutationObserver,
    parseScanResult: deps.parseScanResult || parseScanResult,
    writeCachedProfile:
      deps.writeCachedProfile ||
      ((monsterId, info) =>
        runMonsterCacheAutomation({
          type: MonsterCacheEvent.WRITE_PROFILE,
          monsterId,
          info,
        })),
    storeProfile:
      deps.storeProfile ||
      ((info) =>
        runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_WRITE, info })),
    storeHp:
      deps.storeHp ||
      ((monsterId, level, maxHP, lastUpdate) =>
        runMonsterDbStoreAutomation({
          type: MonsterDbStoreEvent.HP_WRITE,
          monsterId,
          level,
          maxHP,
          lastUpdate,
        })),
    time: deps.time || time,
  };
}

/** 按怪名在当前战斗 DOM 找对应怪元素（用于 scan 污染校验）。 */
function findMonsterEl(name, deps) {
  for (const el of deps.gE("div.btm1", "all")) {
    if (deps.gE(".btm3", el)?.textContent === name) return el;
  }
  return null;
}

/** 处理一条新日志行：含 "Scanning" 才解析入库。 */
function handleLogRow(node, onUpdate, deps) {
  const html = node?.innerHTML;
  if (!html || !html.includes("Scanning")) return;
  const info = deps.parseScanResult(html, deps.time(2));
  if (!info) return;
  // scan 时若该怪被 imperil/firedot 等 debuff 影响，显示抗性失真 → 丢弃
  const monsterEl = findMonsterEl(info.monsterName, deps);
  if (!deps.checkScanResultValidity(monsterEl?.innerHTML)) return;
  // 怪名→MID(+战斗 LV)：库主键 = MID，但 scan 日志只给名 → 从当前战场 monsterStatus(开局 spawn
  // 行已解析 MID/LV)按名定位。无法定位 MID → 不入库（不可无键）。
  // 注：同一战斗内极罕见的同名怪取首条匹配（抗性同名同 trainer 一致；跨 trainer 同名为已知边界）。
  const st = (deps.g("monsterStatus") || []).find((s) => s.name === info.monsterName);
  if (!st || st.monsterId == null) return;
  info.monsterId = st.monsterId;
  Promise.resolve(deps.storeProfile(info))
    .then(() => {
      deps.writeCachedProfile(info.monsterId, info); // 即时进内存 cache（消本轮中途新 scan 怪的缺口）
      // scan 的 max HP + 战斗 LV → 顺带补 (MID,LV) 满血表（与开局 spawn 行同源、互为兜底）
      if (st.level != null && info.maxHP > 0) deps.storeHp(info.monsterId, st.level, info.maxHP, info.lastUpdate);
      onUpdate?.();
    })
    .catch(() => {});
}

/**
 * 启动 scan 监听：MutationObserver 盯 #textlog 新增行。
 * @param {() => void} [onUpdate] 入库成功回调（刷新 UI 面板）
 */
function startMonsterScanLearning(onUpdate, deps) {
  const tbody = deps.gE("#textlog>tbody");
  if (!tbody) return false;
  const observer = new deps.MutationObserver((mutations) => {
    for (const mut of mutations) {
      for (const node of mut.addedNodes) handleLogRow(node, onUpdate, deps);
    }
  });
  observer.observe(tbody, { childList: true });
  return true;
}

export function runMonsterScanLearningAutomation(event = { type: EVENT_START }, deps = {}) {
  if (event.type !== EVENT_START) return false;
  return startMonsterScanLearning(event.onStored, makeDeps(deps));
}
