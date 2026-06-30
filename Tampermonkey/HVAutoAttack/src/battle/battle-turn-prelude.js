import {
  BattleTurnEvent,
  runBattleTurnAutomation as runBattleTurnRuntime,
} from "../state/battle-turn.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { BattleKillBugRecoveryEvent, runBattleKillBugRecovery } from "./kill-bug.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

const EVENT_PREPARE_CURRENT_TURN = "prepareCurrentTurn";

export const BattleTurnPreludeEvent = Object.freeze({
  PREPARE_CURRENT_TURN: EVENT_PREPARE_CURRENT_TURN,
});

const battleTurnPreludeEventHandlers = Object.freeze({
  [EVENT_PREPARE_CURRENT_TURN]: (event) => prepareCurrentTurn(event),
});

const TURN_PRELUDE_STEPS = Object.freeze([
  {
    capability: "monsterStatusReady",
    run: ensureMonsterStatusReady,
  },
  {
    capability: "turnStarted",
    run: reportTurnStarted,
  },
  {
    capability: "monitorHudRefresh",
    run: refreshBattleMonitorHud,
  },
  {
    capability: "killBugRecovery",
    run: recoverKillBug,
  },
  {
    capability: "monsterHpUpdate",
    run: updateMonsterHp,
  },
]);

function prepareCurrentTurn() {
  const facts = {};
  for (const step of TURN_PRELUDE_STEPS) step.run(facts);
  return {
    battleLogTelemetry: facts.battleLogTelemetry,
  };
}

function ensureMonsterStatusReady() {
  runMonsterStatusAutomation({ type: MonsterStatusEvent.ENSURE_READY });
}

function reportTurnStarted(facts) {
  facts.turn = runBattleTurnRuntime({ type: BattleTurnEvent.TURN_STARTED });
}

function refreshBattleMonitorHud() {
  runBattleMonitorAutomation({ type: BattleMonitorEvent.HUD_REFRESH });
}

function recoverKillBug() {
  runBattleKillBugRecovery({ type: BattleKillBugRecoveryEvent.RECOVER });
}

function updateMonsterHp(facts) {
  const result = runMonsterStatusAutomation({
    type: MonsterStatusEvent.UPDATE_HP,
    turn: facts.turn,
  });
  facts.battleLogTelemetry = result?.battleLogTelemetry;
}

export function runBattleTurnPrelude(event = { type: EVENT_PREPARE_CURRENT_TURN }) {
  return battleTurnPreludeEventHandlers[event.type]?.(event) ?? false;
}
