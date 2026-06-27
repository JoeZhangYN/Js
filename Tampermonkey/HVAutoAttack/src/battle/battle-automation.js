// 战斗页自动化编排入口：composition root 只调用本入口。
import { g } from "../state/store.js";
import { installBattleActionEventBridge } from "./reloader.js";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./new-round.js";
import { runBattleTurnAutomation } from "./main-loop.js";
import {
  MonsterKnowledgeEvent,
  runMonsterKnowledgeAutomation,
} from "./monster-knowledge-automation.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";
import {
  BattlePauseControlsEvent,
  runBattlePauseControlsAutomation,
} from "./battle-pause-controls.js";

const EVENT_PAGE_READY = "pageReady";

export const BattleEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

function initBattleRuntime() {
  g("attackStatus", g("option").attackStatus);
  runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.BATTLE_STARTED });
}

function startBattleMonsterKnowledge() {
  runMonsterKnowledgeAutomation({ type: MonsterKnowledgeEvent.BATTLE_STARTED });
}

function startBattleMonitoring() {
  runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED });
}

export function runBattleAutomation(event = { type: EVENT_PAGE_READY }) {
  if (event.type !== EVENT_PAGE_READY) return undefined;
  runBattlePauseControlsAutomation({ type: BattlePauseControlsEvent.INSTALL });
  installBattleActionEventBridge();
  initBattleRuntime();
  runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED });
  startBattleMonsterKnowledge();
  startBattleMonitoring();
  runBattleTurnAutomation();
}
