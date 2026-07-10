// HV 页面类型检测单 SOT（Sentinel M3 应抽未抽 — `#eu span` / `#navbar` / `#riddlecounter` / `#textlog`
// 等检查散落 ≥4 处 init.js + battle action event bridge + showequip-forge-cost.js + 旧 equip-percentile live 实现）。
//
// 单一入口 runPageKindAutomation(event) 返回入口身份与页面类型；后续业务编排只消费 kind，
// world/site 由能力工厂在模块启动时绑定，不沿业务事件传播。
// 现存 page 判断 ad-hoc 逻辑保留作 fallback（不强制全量迁移，本模块作 SOT 优先）。
//
// 不变量：当前脚本实例复用启动时入口身份；仅测试/显式 location 输入会调用纯分类器。
// DOM 页面哨兵仍在每次检测时读取。

import { CURRENT_INGRESS_IDENTITY } from "../core/current-runtime.js";
import { classifyIngress, GameWorld, SiteIdentity } from "../core/ingress-identity.js";

export const PageKind = Object.freeze({
  EHENTAI: "ehentai", // e-hentai.org 域（用于跳转回 HV）
  RIDDLE: "riddle", // 答题页（#riddlecounter 存在）
  BATTLE: "battle", // 战斗中（#textlog 存在 + 无 navbar）
  LOBBY: "lobby", // 战外大厅（#navbar 存在 + 无 riddle/battle）
  ISEKAI_LOBBY: "isekaiLobby", // 异世界战外大厅（独立编排，不跑主世界遭遇战）
  SHOWEQUIP: "showequip", // 装备详情（#eu span 存在或 URL 含 /equip/ 或 showequip.php）
  UNKNOWN: "unknown", // 其他（如载入中、报错页）
});

const EVENT_DETECT_CURRENT = "detectCurrent";

export const PageKindEvent = Object.freeze({
  DETECT_CURRENT: EVENT_DETECT_CURRENT,
});

function pageContext(kind, ingress) {
  return {
    kind,
    site: ingress.site,
    world: ingress.world,
  };
}

function detectPageKind({ document: doc = document, location = window.location, ingress } = {}) {
  const currentLocation = location || window.location;
  const currentDocument = doc || document;
  if (ingress.site === SiteIdentity.EXTERNAL) return PageKind.EHENTAI;
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
  if (currentDocument.getElementById("navbar") && ingress.world === GameWorld.ISEKAI) {
    return PageKind.ISEKAI_LOBBY;
  }
  if (currentDocument.getElementById("navbar")) return PageKind.LOBBY;
  return PageKind.UNKNOWN;
}

function detectPageContext(event) {
  const location = event.location || window.location;
  const ingress = event.location ? classifyIngress(location) : CURRENT_INGRESS_IDENTITY;
  const kind = detectPageKind({
    document: event.document,
    location,
    ingress,
  });
  return pageContext(kind, ingress);
}

const pageKindEventHandlers = Object.freeze({
  [EVENT_DETECT_CURRENT]: detectPageContext,
});

export function runPageKindAutomation(event = { type: EVENT_DETECT_CURRENT }) {
  return pageKindEventHandlers[event?.type]?.(event);
}
