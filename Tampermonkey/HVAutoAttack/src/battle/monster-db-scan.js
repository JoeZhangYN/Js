// scan 自采：监听战斗日志，玩家 scan 怪物时解析九抗写入本地库，补充全量库未覆盖的新怪。
// SHELL：MutationObserver 副作用 + DOM 读取；解析/校验委托纯函数 data/monster-db.js。
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { time } from "../core/time.js";
import { parseScanResult, checkScanResultValidity } from "../data/monster-db.js";
import { setMonsterById, setMonsterHp } from "../state/monster-db-store.js";
import { setCachedMonster } from "../state/monster-cache.js";

/** 按怪名在当前战斗 DOM 找对应怪元素（用于 scan 污染校验）。 */
function findMonsterEl(name) {
  for (const el of gE("div.btm1", "all")) {
    if (gE(".btm3", el)?.textContent === name) return el;
  }
  return null;
}

/** 处理一条新日志行：含 "Scanning" 才解析入库。 */
function handleLogRow(node, onUpdate) {
  const html = node?.innerHTML;
  if (!html || !html.includes("Scanning")) return;
  const info = parseScanResult(html, time(2));
  if (!info) return;
  // scan 时若该怪被 imperil/firedot 等 debuff 影响，显示抗性失真 → 丢弃
  const monsterEl = findMonsterEl(info.monsterName);
  if (!checkScanResultValidity(monsterEl?.innerHTML)) return;
  // 怪名→MID(+战斗 LV)：库主键 = MID，但 scan 日志只给名 → 从当前战场 monsterStatus(开局 spawn
  // 行已解析 MID/LV)按名定位。无法定位 MID → 不入库（不可无键）。
  // 注：同一战斗内极罕见的同名怪取首条匹配（抗性同名同 trainer 一致；跨 trainer 同名为已知边界）。
  const st = (g("monsterStatus") || []).find((s) => s.name === info.monsterName);
  if (!st || st.monsterId == null) return;
  info.monsterId = st.monsterId;
  Promise.resolve(setMonsterById(info))
    .then(() => {
      setCachedMonster(info.monsterId, info); // 即时进内存 cache（消本轮中途新 scan 怪的缺口）
      // scan 的 max HP + 战斗 LV → 顺带补 (MID,LV) 满血表（与开局 spawn 行同源、互为兜底）
      if (st.level != null && info.maxHP > 0) setMonsterHp(info.monsterId, st.level, info.maxHP, info.lastUpdate);
      onUpdate?.();
    })
    .catch(() => {});
}

/**
 * 启动 scan 监听：MutationObserver 盯 #textlog 新增行。
 * @param {() => void} [onUpdate] 入库成功回调（刷新 UI 面板）
 */
export function startMonsterScanLearning(onUpdate) {
  const tbody = gE("#textlog>tbody");
  if (!tbody) return;
  const observer = new MutationObserver((mutations) => {
    for (const mut of mutations) {
      for (const node of mut.addedNodes) handleLogRow(node, onUpdate);
    }
  });
  observer.observe(tbody, { childList: true });
}
