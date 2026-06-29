// 战斗页自动化编排入口：composition root 只调用本入口。
import {
  BattleActionEventBridgeEvent,
  runBattleActionEventBridgeAutomation,
} from "./battle-action-event-bridge.js";
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
import {
  BattlePauseControlsEvent,
  runBattlePauseControlsAutomation,
} from "./battle-pause-controls.js";
import {
  BattleStartRuntimeEvent,
  runBattleStartRuntimeAutomation,
} from "./battle-start-runtime.js";

const EVENT_PAGE_READY = "pageReady";

export const BattleEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

function startBattleMonsterKnowledge() {
  runMonsterKnowledgeAutomation({ type: MonsterKnowledgeEvent.BATTLE_STARTED });
}

function startBattleMonitoring() {
  runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED });
}

export function runBattleAutomation(event = { type: EVENT_PAGE_READY }) {
  if (event.type !== EVENT_PAGE_READY) return undefined;
  runBattlePauseControlsAutomation({ type: BattlePauseControlsEvent.INSTALL });
  runBattleActionEventBridgeAutomation({ type: BattleActionEventBridgeEvent.INSTALL });
  runBattleStartRuntimeAutomation({ type: BattleStartRuntimeEvent.BATTLE_STARTED });
  runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED });
  startBattleMonsterKnowledge();
  startBattleMonitoring();
  runBattleTurnAutomation();
}
