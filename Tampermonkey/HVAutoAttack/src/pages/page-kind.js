// HV 页面类型检测单 SOT（Sentinel M3 应抽未抽 — `#eu span` / `#navbar` / `#riddlecounter` / `#textlog`
// 等检查散落 ≥4 处 init.js + battle action event bridge + showequip-forge-cost.js + 旧 equip-percentile live 实现）。
//
// 单一入口 runPageKindAutomation(event) 返回 enum-style 字符串，调用方 switch 穷尽。
// 现存 page 判断 ad-hoc 逻辑保留作 fallback（不强制全量迁移，本模块作 SOT 优先）。
//
// 不变量：每次调用都重查 DOM/URL（页面跳转后值会变；脚本进入页面后页面结构稳定，重查代价 ≈ 1 querySelector）。

export const PageKind = Object.freeze({
  EHENTAI: "ehentai", // e-hentai.org 域（用于跳转回 HV）
  RIDDLE: "riddle", // 答题页（#riddlecounter 存在）
  BATTLE: "battle", // 战斗中（#textlog 存在 + 无 navbar）
  LOBBY: "lobby", // 战外大厅（#navbar 存在 + 无 riddle/battle）
  SHOWEQUIP: "showequip", // 装备详情（#eu span 存在或 URL 含 /equip/ 或 showequip.php）
  UNKNOWN: "unknown", // 其他（如载入中、报错页）
});

const EVENT_DETECT_CURRENT = "detectCurrent";

export const PageKindEvent = Object.freeze({
  DETECT_CURRENT: EVENT_DETECT_CURRENT,
});

function detectPageKind({ document: doc = document, location = window.location } = {}) {
  if (location.host === "e-hentai.org") return PageKind.EHENTAI;
  if (doc.getElementById("riddlecounter")) return PageKind.RIDDLE;
  if (doc.getElementById("textlog") && !doc.getElementById("navbar")) return PageKind.BATTLE;
  // showequip：#eu span 是详情特征；/equip/ URL 是独立装备页；showequip.php 是 popup-from-lobby
  if (
    doc.querySelector("#eu span") ||
    /\/equip\//.test(location.pathname) ||
    /showequip\.php/.test(location.pathname)
  ) {
    return PageKind.SHOWEQUIP;
  }
  if (doc.getElementById("navbar")) return PageKind.LOBBY;
  return PageKind.UNKNOWN;
}

export function runPageKindAutomation(event = { type: EVENT_DETECT_CURRENT }) {
  if (event.type === EVENT_DETECT_CURRENT) {
    return detectPageKind({
      document: event.document,
      location: event.location,
    });
  }
  return undefined;
}
