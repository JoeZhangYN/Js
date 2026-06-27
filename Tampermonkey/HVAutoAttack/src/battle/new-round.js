// 新一轮战斗初始化：怪物计数 / 轮次识别。
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { goto } from "../core/navigate.js";
import { EncounterEvent, runEncounterAutomation } from "../pages/encounter.js";
import { observeBattle } from "../state/auto-tune.js";
import {
  MonsterKnowledgeEvent,
  runMonsterKnowledgeAutomation,
} from "./monster-knowledge-automation.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { BattleStaminaEvent, runBattleStaminaAutomation } from "./battle-stamina.js";

export function newRound() {
  // F auto-tune：上一回合结束 → 观测用药数 + 复位计数
  if (g("option")?.autoTune && (g("turn") || 0) > 0) {
    const used = g("autoTunePotionCount") || 0;
    observeBattle(used);
  }
  g("autoTunePotionCount", 0);
  // New Round
  g("turn", 0);
  if (window.location.hash !== "") goto();
  g("monsterAll", gE("div.btm1", "all").length);
  const monsterDead = gE('img[src*="nbardead"]', "all").length;
  g("monsterAlive", g("monsterAll") - monsterDead);
  g("bossAll", gE('div.btm2[style^="background"]', "all").length);
  const bossDead = gE('div.btm1[style*="opacity"] div.btm2[style*="background"]', "all").length;
  g("bossAlive", g("bossAll") - bossDead);
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
      monsterAll: g("monsterAll"),
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
