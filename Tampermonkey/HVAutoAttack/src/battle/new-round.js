// 新一轮战斗初始化：怪物计数 / 轮次识别。
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { goto } from "../core/navigate.js";
import { EncounterEvent, runEncounterAutomation } from "../pages/encounter.js";
import { AutoTuneEvent, runAutoTuneAutomation } from "../state/auto-tune.js";
import {
  MonsterKnowledgeEvent,
  runMonsterKnowledgeAutomation,
} from "./monster-knowledge-automation.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { BattleStaminaEvent, runBattleStaminaAutomation } from "./battle-stamina.js";

const EVENT_ROUND_STARTED = "roundStarted";

export const BattleRoundStartEvent = Object.freeze({
  ROUND_STARTED: EVENT_ROUND_STARTED,
});

function startRound() {
  // F auto-tune：上一回合结束 → 观测用药数 + 复位计数
  if (g("option")?.autoTune && (g("turn") || 0) > 0) {
    const used = g("autoTunePotionCount") || 0;
    runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_BATTLE, potionsUsed: used });
  }
  g("autoTunePotionCount", 0);
  // New Round
  g("turn", 0);
  if (window.location.hash !== "") goto();
  runMonsterStatusAutomation({ type: MonsterStatusEvent.REFRESH_COMBATANT_COUNTS });
  const battleLog = gE("#textlog>tbody>tr>td", "all");
  g(
    "roundType",
    (function () {
      const persistedRoundType = runBattleRoundAutomation({ type: BattleRoundEvent.READ_TYPE });
      if (persistedRoundType) return persistedRoundType;
      const temp = battleLog[battleLog.length - 1].textContent;
      const roundType = runBattleRoundAutomation({
        type: BattleRoundEvent.CLASSIFY_TYPE,
        initializingText: temp,
      });
      if (roundType === "ba") {
        if (g("option").encounter) {
          runEncounterAutomation({
            type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
          });
        }
      }
      return runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_TYPE,
        roundType,
      });
    })()
  );
  const staminaOutcome = runBattleStaminaAutomation({
    type: BattleStaminaEvent.ROUND_LOG_READY,
    text: battleLog[0].textContent,
  });
  if (staminaOutcome.paused) {
    return;
  }
  if (battleLog[battleLog.length - 1].textContent.match("Initializing")) {
    const initializingText = battleLog[battleLog.length - 1].textContent;
    runMonsterStatusAutomation({
      type: MonsterStatusEvent.RECORD_SPAWN_ROSTER,
      battleLog,
    });
    runBattleRoundAutomation({
      type: BattleRoundEvent.RECORD_COUNT_FROM_INITIALIZATION,
      initializingText,
      roundType: g("roundType"),
    });
  } else if (runMonsterStatusAutomation({ type: MonsterStatusEvent.ENSURE_READY })) {
    runBattleRoundAutomation({ type: BattleRoundEvent.RECORD_SINGLE_ROUND });
  }
  runBattleRoundAutomation({ type: BattleRoundEvent.SYNC_RUNTIME });
  g("skillOTOS", {
    OFC: 0,
    FRD: 0,
    T3: 0,
    T2: 0,
    T1: 0,
  });
  runMonsterKnowledgeAutomation({ type: MonsterKnowledgeEvent.ROUND_STARTED });
}

export function runBattleRoundStartAutomation(event = { type: EVENT_ROUND_STARTED }) {
  if (event.type !== EVENT_ROUND_STARTED) return false;
  startRound();
  return true;
}
