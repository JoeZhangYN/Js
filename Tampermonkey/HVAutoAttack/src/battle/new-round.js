// 新一轮战斗初始化：怪物计数 / 轮次识别 / battleCode 记录。
import { gE } from "../dom/query.js";
import { setValue, getValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { goto } from "../core/navigate.js";
import { time } from "../core/time.js";
import { setAlarm } from "../alarm/alarm.js";
import { EncounterEvent, runEncounterAutomation } from "../pages/encounter.js";
import { fixMonsterStatus, pauseChange } from "./main-loop.js";
import { parseMonsterRoster, buildMonsterStatus } from "./log-parser.js";
import { observeBattle } from "../state/auto-tune.js";
import {
  MonsterKnowledgeEvent,
  runMonsterKnowledgeAutomation,
} from "./monster-knowledge-automation.js";

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
  const bossDead = gE(
    'div.btm1[style*="opacity"] div.btm2[style*="background"]',
    "all"
  ).length;
  g("bossAlive", g("bossAll") - bossDead);
  const battleLog = gE("#textlog>tbody>tr>td", "all");
  g(
    "roundType",
    (function () {
      if (getValue("roundType")) {
        return getValue("roundType");
      }
      let roundType;
      const temp = battleLog[battleLog.length - 1].textContent;
      if (!temp.match(/^Initializing/)) {
        roundType = "";
      } else if (
        temp.match(/^Initializing arena challenge/) &&
        temp.match(/\d+/)[0] * 1 <= 35
      ) {
        roundType = "ar";
      } else if (
        temp.match(/^Initializing arena challenge/) &&
        temp.match(/\d+/)[0] * 1 >= 105
      ) {
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
      setValue("roundType", roundType);
      return roundType;
    })()
  );
  if (/You lose \d+ Stamina/.test(battleLog[0].textContent)) {
    const staminaLostLog = getValue("staminaLostLog", true) || {};
    staminaLostLog[time(3)] =
      battleLog[0].textContent.match(/You lose (\d+) Stamina/)[1] * 1;
    setValue("staminaLostLog", staminaLostLog);
    const losedStamina = battleLog[0].textContent.match(/\d+/)[0] * 1;
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
        pauseChange();
        return;
      }
    }
  }
  if (battleLog[battleLog.length - 1].textContent.match("Initializing")) {
    // 怪物身份+满血单一来源：开局 spawn 行 MID/name/LV/HP（parseMonsterRoster 含 null 守卫 + 退化降级）
    const { roster } = parseMonsterRoster(battleLog, g("monsterAll"));
    const monsterStatus = buildMonsterStatus(roster);
    setValue("monsterStatus", monsterStatus);
    g("monsterStatus", monsterStatus);
    let roundNow;
    let roundAll;
    const round = battleLog[battleLog.length - 1].textContent.match(
      /\(Round (\d+) \/ (\d+)\)/
    );
    if (g("roundType") !== "ba" && round !== null) {
      roundNow = round[1] * 1;
      roundAll = round[2] * 1;
    } else {
      roundNow = 1;
      roundAll = 1;
    }
    setValue("roundNow", roundNow);
    setValue("roundAll", roundAll);
  } else if (
    !getValue("monsterStatus") ||
    getValue("monsterStatus", true).length !== gE("div.btm2", "all").length
  ) {
    setValue("roundNow", 1);
    setValue("roundAll", 1);
    fixMonsterStatus();
  }
  g("roundNow", getValue("roundNow") * 1);
  g("roundAll", getValue("roundAll") * 1);
  g("roundLeft", getValue("roundAll") - g("roundNow"));
  g("skillOTOS", {
    OFC: 0,
    FRD: 0,
    T3: 0,
    T2: 0,
    T1: 0,
  });
  runMonsterKnowledgeAutomation({ type: MonsterKnowledgeEvent.ROUND_STARTED });
}
