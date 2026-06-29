// scan 自采：监听战斗日志，玩家 scan 怪物时解析九抗写入本地库，补充全量库未覆盖的新怪。
// SHELL：MutationObserver 副作用 + DOM 读取；scan 记录决策委托 monster-scan-result-learning。
import { gE } from "../dom/query.js";
import {
  MonsterScanResultLearningEvent,
  runMonsterScanResultLearning,
} from "./monster-scan-result-learning.js";

const EVENT_START = "start";

export const MonsterScanLearningEvent = Object.freeze({
  START: EVENT_START,
});

function makeDeps(deps) {
  return {
    gE: deps.gE || gE,
    MutationObserver: deps.MutationObserver || MutationObserver,
    recordScanResult:
      deps.recordScanResult || ((event) => runMonsterScanResultLearning(event, deps)),
  };
}

function readMonsterMarkup(name, deps) {
  for (const el of deps.gE("div.btm1", "all")) {
    if (deps.gE(".btm3", el)?.textContent === name) return el.innerHTML;
  }
  return "";
}

function handleLogRow(node, onUpdate, deps) {
  deps.recordScanResult({
    type: MonsterScanResultLearningEvent.RECORD_LOG_ROW,
    html: node?.innerHTML,
    onStored: onUpdate,
    readMonsterMarkup: (name) => readMonsterMarkup(name, deps),
  });
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

const monsterScanLearningEventHandlers = Object.freeze({
  [EVENT_START]: (event, deps) => startMonsterScanLearning(event.onStored, makeDeps(deps)),
});

export function runMonsterScanLearningAutomation(event = { type: EVENT_START }, deps = {}) {
  return monsterScanLearningEventHandlers[event.type]?.(event, deps) || false;
}
