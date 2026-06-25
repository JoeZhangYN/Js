// scan 自采：监听战斗日志，玩家 scan 怪物时解析九抗写入本地库，补充全量库未覆盖的新怪。
// SHELL：MutationObserver 副作用 + DOM 读取；解析/校验委托纯函数 data/monster-db.js。
import { gE } from "../dom/query.js";
import { time } from "../core/time.js";
import { parseScanResult, checkScanResultValidity } from "../data/monster-db.js";
import { setMonster } from "../state/monster-db-store.js";
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
  Promise.resolve(setMonster(info))
    .then(() => {
      setCachedMonster(info.monsterName, info); // 即时进内存 cache（消本轮中途新 scan 怪的缺口 R2）
      onUpdate?.();
    })
    .catch(() => {});
}

/**
 * 启动 scan 监听：MutationObserver 盯 #textlog 新增行。
 * @param {() => void} [onUpdate] 入库成功回调（刷新 UI 面板）
 */
export function setupScanWatch(onUpdate) {
  const tbody = gE("#textlog>tbody");
  if (!tbody) return;
  const observer = new MutationObserver((mutations) => {
    for (const mut of mutations) {
      for (const node of mut.addedNodes) handleLogRow(node, onUpdate);
    }
  });
  observer.observe(tbody, { childList: true });
}
