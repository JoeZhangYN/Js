// 怪物知识编排入口：全量库同步、scan 自采监听、九抗面板刷新统一从这里进入。
import {
  MonsterResistPanelEvent,
  runMonsterResistPanelAutomation,
} from "../monitor/monster-resist-panel.js";
import { MonsterScanLearningEvent, runMonsterScanLearningAutomation } from "./monster-db-scan.js";
import { MonsterDbSyncEvent, runMonsterDbSyncAutomation } from "./monster-db-sync.js";

const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_ROUND_STARTED = "roundStarted";
const EVENT_SCAN_UPDATED = "scanUpdated";

export const MonsterKnowledgeEvent = Object.freeze({
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
  ROUND_STARTED: EVENT_ROUND_STARTED,
  SCAN_UPDATED: EVENT_SCAN_UPDATED,
});

function refreshResistPanel() {
  runMonsterResistPanelAutomation({ type: MonsterResistPanelEvent.REFRESH });
}

function startMonsterKnowledge() {
  runMonsterDbSyncAutomation({ type: MonsterDbSyncEvent.SYNC_REQUESTED });
  runMonsterScanLearningAutomation({
    type: MonsterScanLearningEvent.START,
    onStored: () => runMonsterKnowledgeAutomation({ type: EVENT_SCAN_UPDATED }),
  });
}

const monsterKnowledgeEventHandlers = Object.freeze({
  [EVENT_BATTLE_STARTED]: () => startMonsterKnowledge(),
  [EVENT_ROUND_STARTED]: () => refreshResistPanel(),
  [EVENT_SCAN_UPDATED]: () => refreshResistPanel(),
});

export function runMonsterKnowledgeAutomation(event = { type: EVENT_ROUND_STARTED }) {
  return monsterKnowledgeEventHandlers[event.type]?.(event);
}
