// 怪物状态生命周期入口：持久态恢复、异常修复、每 turn HP/权重更新统一从这里进入。
import { gE } from "../dom/query.js";
import { setValue, getValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { goto } from "../core/navigate.js";
import { countMonsterHP } from "./attack.js";
import { parseMonsterRoster, buildMonsterStatus } from "./log-parser.js";

const EVENT_ENSURE_READY = "ensureReady";
const EVENT_REPAIR = "repair";
const EVENT_RECORD_SPAWN_ROSTER = "recordSpawnRoster";
const EVENT_UPDATE_HP = "updateHp";

export const MonsterStatusEvent = Object.freeze({
  ENSURE_READY: EVENT_ENSURE_READY,
  REPAIR: EVENT_REPAIR,
  RECORD_SPAWN_ROSTER: EVENT_RECORD_SPAWN_ROSTER,
  UPDATE_HP: EVENT_UPDATE_HP,
});

function recordSpawnRoster(event) {
  const { roster } = parseMonsterRoster(event.battleLog, event.monsterAll);
  const monsterStatus = buildMonsterStatus(roster);
  setValue("monsterStatus", monsterStatus);
  g("monsterStatus", monsterStatus);
}

function repairMonsterStatus() {
  const battleLog = gE("#textlog>tbody>tr>td", "all");
  const monsterAll = gE("div.btm2", "all").length;
  const hasInit =
    battleLog.length &&
    /Initializing/.test(battleLog[battleLog.length - 1].textContent);

  if (hasInit) {
    const { roster } = parseMonsterRoster(battleLog, monsterAll);
    setValue("monsterStatus", buildMonsterStatus(roster));
    goto();
    return;
  }

  document.title = _alert(
    -1,
    "monsterStatus错误，正在尝试修复",
    "monsterStatus錯誤，正在嘗試修復",
    "monsterStatus Error, trying to fix"
  );
  const monsterStatus = [];
  gE("div.btm2", "all").forEach((monster, i) => {
    monsterStatus.push({
      order: i,
      id: i === 9 ? 0 : i + 1,
      hp: monster.style.background === "" ? 1000 : 100000,
      hpInferred: true,
    });
  });
  setValue("monsterStatus", monsterStatus);
  goto();
}

function ensureMonsterStatusReady() {
  const persisted = getValue("monsterStatus", true);
  if (persisted && persisted.length === g("monsterAll")) {
    g("monsterStatus", persisted);
    return false;
  }
  repairMonsterStatus();
  return true;
}

export function runMonsterStatusAutomation(
  event = { type: EVENT_ENSURE_READY }
) {
  if (event.type === EVENT_ENSURE_READY) {
    return ensureMonsterStatusReady();
  } else if (event.type === EVENT_REPAIR) {
    repairMonsterStatus();
  } else if (event.type === EVENT_RECORD_SPAWN_ROSTER) {
    recordSpawnRoster(event);
  } else if (event.type === EVENT_UPDATE_HP) {
    countMonsterHP();
  }
  return false;
}
