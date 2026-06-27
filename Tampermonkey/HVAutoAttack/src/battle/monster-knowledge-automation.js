// 怪物知识编排入口：全量库同步、scan 自采监听、九抗面板刷新统一从这里进入。
import { renderResistPanel } from "../monitor/monster-resist-panel.js";
import { setupScanWatch } from "./monster-db-scan.js";
import { syncMonsterDb } from "./monster-db-sync.js";

const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_ROUND_STARTED = "roundStarted";
const EVENT_SCAN_UPDATED = "scanUpdated";

export const MonsterKnowledgeEvent = Object.freeze({
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
  ROUND_STARTED: EVENT_ROUND_STARTED,
  SCAN_UPDATED: EVENT_SCAN_UPDATED,
});

function refreshResistPanel() {
  renderResistPanel();
}

function startMonsterKnowledge() {
  syncMonsterDb();
  setupScanWatch(() =>
    runMonsterKnowledgeAutomation({ type: EVENT_SCAN_UPDATED })
  );
}

export function runMonsterKnowledgeAutomation(
  event = { type: EVENT_ROUND_STARTED }
) {
  if (event.type === EVENT_BATTLE_STARTED) {
    startMonsterKnowledge();
    return;
  }
  if (event.type === EVENT_ROUND_STARTED || event.type === EVENT_SCAN_UPDATED) {
    refreshResistPanel();
  }
}
