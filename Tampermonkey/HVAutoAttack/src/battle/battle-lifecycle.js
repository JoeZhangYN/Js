import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import {
  BattleStartRuntimeEvent,
  runBattleStartRuntimeAutomation,
} from "./battle-start-runtime.js";
import {
  MonsterKnowledgeEvent,
  runMonsterKnowledgeAutomation,
} from "./monster-knowledge-automation.js";

const EVENT_BATTLE_STARTED = "battleStarted";

export const BattleLifecycleEvent = Object.freeze({
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
});

function startBattle() {
  runBattleStartRuntimeAutomation({ type: BattleStartRuntimeEvent.BATTLE_STARTED });
  runMonsterKnowledgeAutomation({ type: MonsterKnowledgeEvent.BATTLE_STARTED });
  runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED });
  return true;
}

const battleLifecycleHandlers = Object.freeze({
  [EVENT_BATTLE_STARTED]: () => startBattle(),
});

export function runBattleLifecycleAutomation(event = { type: EVENT_BATTLE_STARTED }) {
  return battleLifecycleHandlers[event.type]?.(event) ?? false;
}
