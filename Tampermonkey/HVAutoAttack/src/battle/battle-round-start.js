// 战斗轮次开始编排：怪物计数 / 轮次识别。
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { EncounterEvent, runEncounterAutomation } from "../pages/encounter.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { BattleStaminaEvent, runBattleStaminaAutomation } from "./battle-stamina.js";
import { BattleRoundLifecycleEvent, runBattleRoundLifecycle } from "./round-lifecycle.js";
import { BattleRoundStartLogEvent, runBattleRoundStartLog } from "./round-start-log.js";

const EVENT_ROUND_STARTED = "roundStarted";

export const BattleRoundStartEvent = Object.freeze({
  ROUND_STARTED: EVENT_ROUND_STARTED,
});

function recordRoundStartContext(initializingText) {
  const context = runBattleRoundAutomation({
    type: BattleRoundEvent.RECORD_START_CONTEXT,
    initializingText,
  });
  if (context.randomEncounterStarted) {
    runEncounterAutomation({
      type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
    });
  }
  return context;
}

function cleanupBattleHash() {
  if (window.location.hash === "") return;
  runNavigationAutomation({
    type: NavigationEvent.RELOAD_NOW,
    reason: NavigationReloadReason.BATTLE_HASH_CLEANUP,
    detail: { source: "battleRoundStart", hash: window.location.hash },
  });
}

function startRound() {
  runBattleRoundLifecycle({ type: BattleRoundLifecycleEvent.ROUND_STARTED });
  cleanupBattleHash();
  runMonsterStatusAutomation({ type: MonsterStatusEvent.REFRESH_COMBATANT_COUNTS });
  const roundStartLog = runBattleRoundStartLog({ type: BattleRoundStartLogEvent.READ_CURRENT });
  const { initializingText } = roundStartLog;
  const roundStartContext = recordRoundStartContext(initializingText);
  const staminaOutcome = runBattleStaminaAutomation({
    type: BattleStaminaEvent.ROUND_LOG_READY,
    text: roundStartLog.firstText,
  });
  if (staminaOutcome.paused) {
    return;
  }
  const monsterStatusOutcome = runMonsterStatusAutomation({
    type: MonsterStatusEvent.PREPARE_ROUND_START,
    battleLogRows: roundStartLog.rows,
    initialized: roundStartContext.initialized,
  });
  runBattleRoundAutomation({
    type: BattleRoundEvent.RECORD_START_COUNT,
    initializingText,
    roundType: roundStartContext.roundType,
    initialized: roundStartContext.initialized,
    repaired: monsterStatusOutcome.repaired,
  });
  runBattleRoundAutomation({ type: BattleRoundEvent.SYNC_RUNTIME });
  runBattleRoundLifecycle({ type: BattleRoundLifecycleEvent.ROUND_READY });
}

const battleRoundStartEventHandlers = Object.freeze({
  [EVENT_ROUND_STARTED]: () => {
    startRound();
    return true;
  },
});

export function runBattleRoundStartAutomation(event = { type: EVENT_ROUND_STARTED }) {
  return battleRoundStartEventHandlers[event.type]?.(event) ?? false;
}
