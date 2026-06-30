import {
  BattleTurnEvent,
  runBattleTurnAutomation as runBattleTurnRuntime,
} from "../state/battle-turn.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { killBug } from "./kill-bug.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

const EVENT_PREPARE_CURRENT_TURN = "prepareCurrentTurn";

export const BattleTurnPreludeEvent = Object.freeze({
  PREPARE_CURRENT_TURN: EVENT_PREPARE_CURRENT_TURN,
});

const battleTurnPreludeEventHandlers = Object.freeze({
  [EVENT_PREPARE_CURRENT_TURN]: () => prepareCurrentTurn(),
});

function prepareCurrentTurn() {
  runMonsterStatusAutomation({ type: MonsterStatusEvent.ENSURE_READY });
  runBattleTurnRuntime({ type: BattleTurnEvent.TURN_STARTED });
  runBattleMonitorAutomation({ type: BattleMonitorEvent.HUD_REFRESH });
  killBug();
  runMonsterStatusAutomation({ type: MonsterStatusEvent.UPDATE_HP });
  return true;
}

export function runBattleTurnPrelude(event = { type: EVENT_PREPARE_CURRENT_TURN }) {
  return battleTurnPreludeEventHandlers[event.type]?.() ?? false;
}
