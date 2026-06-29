// 新一轮战斗初始化：怪物计数 / 轮次识别。
import { gE } from "../dom/query.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "../state/battle-turn.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { EncounterEvent, runEncounterAutomation } from "../pages/encounter.js";
import { AutoTuneEvent, runAutoTuneAutomation } from "../state/auto-tune.js";
import {
  MonsterKnowledgeEvent,
  runMonsterKnowledgeAutomation,
} from "./monster-knowledge-automation.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { BattleStaminaEvent, runBattleStaminaAutomation } from "./battle-stamina.js";
import { BattleSkillUsageEvent, runBattleSkillUsageAutomation } from "./battle-skill-usage.js";

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
  runAutoTuneAutomation({ type: AutoTuneEvent.ROUND_STARTED });
  // New Round
  runBattleTurnAutomation({ type: BattleTurnEvent.ROUND_STARTED });
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
  if (roundStartContext.initialized) {
    runMonsterStatusAutomation({
      type: MonsterStatusEvent.RECORD_SPAWN_ROSTER,
      battleLog,
    });
    runBattleRoundAutomation({
      type: BattleRoundEvent.RECORD_COUNT_FROM_INITIALIZATION,
      initializingText,
      roundType: roundStartContext.roundType,
    });
  } else if (runMonsterStatusAutomation({ type: MonsterStatusEvent.ENSURE_READY })) {
    runBattleRoundAutomation({ type: BattleRoundEvent.RECORD_SINGLE_ROUND });
  }
  runBattleRoundAutomation({ type: BattleRoundEvent.SYNC_RUNTIME });
  runBattleSkillUsageAutomation({ type: BattleSkillUsageEvent.RESET_ROUND });
  runMonsterKnowledgeAutomation({ type: MonsterKnowledgeEvent.ROUND_STARTED });
}

export function runBattleRoundStartAutomation(event = { type: EVENT_ROUND_STARTED }) {
  if (event.type !== EVENT_ROUND_STARTED) return false;
  startRound();
  return true;
}
