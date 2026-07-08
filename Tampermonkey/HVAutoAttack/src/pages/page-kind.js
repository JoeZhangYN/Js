// HV 页面类型检测单 SOT（Sentinel M3 应抽未抽 — `#eu span` / `#navbar` / `#riddlecounter` / `#textlog`
// 等检查散落 ≥4 处 init.js + battle action event bridge + showequip-forge-cost.js + 旧 equip-percentile live 实现）。
//
// 单一入口 runPageKindAutomation(event) 返回 typed page context，调用方消费 kind/world。
// 现存 page 判断 ad-hoc 逻辑保留作 fallback（不强制全量迁移，本模块作 SOT 优先）。
//
// 不变量：每次调用都重查 DOM/URL（页面跳转后值会变；脚本进入页面后页面结构稳定，重查代价 ≈ 1 querySelector）。

export const PageKind = Object.freeze({
  EHENTAI: "ehentai", // e-hentai.org 域（用于跳转回 HV）
  RIDDLE: "riddle", // 答题页（#riddlecounter 存在）
  BATTLE: "battle", // 战斗中（#textlog 存在 + 无 navbar）
  LOBBY: "lobby", // 战外大厅（#navbar 存在 + 无 riddle/battle）
  ISEKAI_LOBBY: "isekaiLobby", // 异世界战外大厅（独立编排，不跑主世界遭遇战）
  SHOWEQUIP: "showequip", // 装备详情（#eu span 存在或 URL 含 /equip/ 或 showequip.php）
  UNKNOWN: "unknown", // 其他（如载入中、报错页）
});

export const PageWorld = Object.freeze({
  PERSISTENT: "persistent",
  ISEKAI: "isekai",
  EXTERNAL: "external",
});

const EVENT_DETECT_CURRENT = "detectCurrent";

export const PageKindEvent = Object.freeze({
  DETECT_CURRENT: EVENT_DETECT_CURRENT,
});

function detectPageWorld(location = window.location) {
  if (location.host === "e-hentai.org") return PageWorld.EXTERNAL;
  return /\/isekai\/?/.test(location.pathname) ? PageWorld.ISEKAI : PageWorld.PERSISTENT;
}

function pageContext(kind, world) {
  return {
    kind,
    world,
    isIsekai: world === PageWorld.ISEKAI,
  };
}

function detectPageKind({ document: doc = document, location = window.location } = {}) {
  const currentLocation = location || window.location;
  const currentDocument = doc || document;
  if (currentLocation.host === "e-hentai.org") return PageKind.EHENTAI;
  if (currentDocument.getElementById("riddlecounter")) return PageKind.RIDDLE;
  if (currentDocument.getElementById("textlog") && !currentDocument.getElementById("navbar")) {
    return PageKind.BATTLE;
  }
  // showequip：#eu span 是详情特征；/equip/ URL 是独立装备页；showequip.php 是 popup-from-lobby
  if (
    currentDocument.querySelector("#eu span") ||
    /\/equip\//.test(currentLocation.pathname) ||
    /showequip\.php/.test(currentLocation.pathname)
  ) {
    return PageKind.SHOWEQUIP;
  }
  if (currentDocument.getElementById("navbar") && /\/isekai\/?/.test(currentLocation.pathname)) {
    return PageKind.ISEKAI_LOBBY;
  }
  if (currentDocument.getElementById("navbar")) return PageKind.LOBBY;
  return PageKind.UNKNOWN;
}

function detectPageContext(event) {
  const location = event.location;
  const kind = detectPageKind({
    document: event.document,
    location,
  });
  return pageContext(kind, detectPageWorld(location));
}

const pageKindEventHandlers = Object.freeze({
  [EVENT_DETECT_CURRENT]: detectPageContext,
});

export function runPageKindAutomation(event = { type: EVENT_DETECT_CURRENT }) {
  return pageKindEventHandlers[event?.type]?.(event);
}
