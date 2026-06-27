// 新一轮战斗初始化：怪物计数 / 轮次识别。
import { gE } from "../dom/query.js";
import { setValue, getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { goto } from "../core/navigate.js";
import { setAlarm } from "../alarm/alarm.js";
import { EncounterEvent, runEncounterAutomation } from "../pages/encounter.js";
import { observeBattle } from "../state/auto-tune.js";
import { recordStaminaLoss } from "../state/stamina-loss-log.js";
import {
  MonsterKnowledgeEvent,
  runMonsterKnowledgeAutomation,
} from "./monster-knowledge-automation.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";

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
      if (getValue(STORAGE_KEYS.ROUND_TYPE)) {
        return getValue(STORAGE_KEYS.ROUND_TYPE);
      }
      let roundType;
      const temp = battleLog[battleLog.length - 1].textContent;
      if (!temp.match(/^Initializing/)) {
        roundType = "";
      } else if (temp.match(/^Initializing arena challenge/) && temp.match(/\d+/)[0] * 1 <= 35) {
        roundType = "ar";
      } else if (temp.match(/^Initializing arena challenge/) && temp.match(/\d+/)[0] * 1 >= 105) {
        roundType = "rb";
      } else if (temp.match(/^Initializing random encounter/)) {
        roundType = "ba";
        if (g("option").encounter) {
          runEncounterAutomation({
            type: EncounterEvent.RANDOM_ENCOUNTER_STARTED,
          });
        }
      } else if (temp.match(/^Initializing Item World/)) {
        roundType = "iw";
      } else if (temp.match(/^Initializing Grindfest/)) {
        roundType = "gr";
      } else if (temp.match(/^Initializing The Tower/)) {
        roundType = "tw";
      } else {
        roundType = "";
      }
      setValue(STORAGE_KEYS.ROUND_TYPE, roundType);
      return roundType;
    })()
  );
  if (/You lose \d+ Stamina/.test(battleLog[0].textContent)) {
    const losedStamina = battleLog[0].textContent.match(/\d+/)[0] * 1;
    recordStaminaLoss(losedStamina);
    if (losedStamina >= g("option").staminaLose) {
      setAlarm("Error");
      if (
        !_alert(
          1,
          "当前Stamina过低\n或Stamina损失过多\n是否继续？",
          "當前Stamina過低\n或Stamina損失過多\n是否繼續？",
          "Continue?\nYou either have too little Stamina or have lost too much"
        )
      ) {
        runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE });
        return;
      }
    }
  }
  if (battleLog[battleLog.length - 1].textContent.match("Initializing")) {
    runMonsterStatusAutomation({
      type: MonsterStatusEvent.RECORD_SPAWN_ROSTER,
      battleLog,
      monsterAll: g("monsterAll"),
    });
    let roundNow;
    let roundAll;
    const round = battleLog[battleLog.length - 1].textContent.match(/\(Round (\d+) \/ (\d+)\)/);
    if (g("roundType") !== "ba" && round !== null) {
      roundNow = round[1] * 1;
      roundAll = round[2] * 1;
    } else {
      roundNow = 1;
      roundAll = 1;
    }
    setValue(STORAGE_KEYS.ROUND_NOW, roundNow);
    setValue(STORAGE_KEYS.ROUND_ALL, roundAll);
  } else if (runMonsterStatusAutomation({ type: MonsterStatusEvent.ENSURE_READY })) {
    setValue(STORAGE_KEYS.ROUND_NOW, 1);
    setValue(STORAGE_KEYS.ROUND_ALL, 1);
  }
  g("roundNow", getValue(STORAGE_KEYS.ROUND_NOW) * 1);
  g("roundAll", getValue(STORAGE_KEYS.ROUND_ALL) * 1);
  g("roundLeft", getValue(STORAGE_KEYS.ROUND_ALL) - g("roundNow"));
  g("skillOTOS", {
    OFC: 0,
    FRD: 0,
    T3: 0,
    T2: 0,
    T1: 0,
  });
  runMonsterKnowledgeAutomation({ type: MonsterKnowledgeEvent.ROUND_STARTED });
}
