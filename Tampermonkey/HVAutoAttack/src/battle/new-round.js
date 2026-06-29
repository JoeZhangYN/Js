// 新一轮战斗初始化：怪物计数 / 轮次识别。
import { gE } from "../dom/query.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { EncounterEvent, runEncounterAutomation } from "../pages/encounter.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { BattleStaminaEvent, runBattleStaminaAutomation } from "./battle-stamina.js";
import { BattleRoundLifecycleEvent, runBattleRoundLifecycle } from "./round-lifecycle.js";

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

function startRound() {
  runBattleRoundLifecycle({ type: BattleRoundLifecycleEvent.ROUND_STARTED });
  if (window.location.hash !== "") runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW });
  runMonsterStatusAutomation({ type: MonsterStatusEvent.REFRESH_COMBATANT_COUNTS });
  const battleLog = gE("#textlog>tbody>tr>td", "all");
  const initializingText = battleLog[battleLog.length - 1].textContent;
  const roundStartContext = recordRoundStartContext(initializingText);
  const staminaOutcome = runBattleStaminaAutomation({
    type: BattleStaminaEvent.ROUND_LOG_READY,
    text: battleLog[0].textContent,
  });
  if (staminaOutcome.paused) {
    return;
  }
  const monsterStatusOutcome = runMonsterStatusAutomation({
    type: MonsterStatusEvent.PREPARE_ROUND_START,
    battleLog,
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

export function runBattleRoundStartAutomation(event = { type: EVENT_ROUND_STARTED }) {
  if (event.type !== EVENT_ROUND_STARTED) return false;
  startRound();
  return true;
}
