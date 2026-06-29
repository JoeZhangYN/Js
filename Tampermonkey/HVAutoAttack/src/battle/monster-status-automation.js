// 怪物状态生命周期入口：持久态恢复、异常修复、每 turn HP/权重更新统一从这里进入。
import { gE } from "../dom/query.js";
import { setValue, getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { parseMonsterRoster, buildMonsterStatus } from "./log-parser.js";
import { updateMonsterHpRuntime } from "./monster-status-hp.js";

const EVENT_ENSURE_READY = "ensureReady";
const EVENT_REPAIR = "repair";
const EVENT_RECORD_SPAWN_ROSTER = "recordSpawnRoster";
const EVENT_UPDATE_HP = "updateHp";
const EVENT_REFRESH_COMBATANT_COUNTS = "refreshCombatantCounts";
const EVENT_READ_COMBATANT_COUNTS = "readCombatantCounts";
const EVENT_READ_IDS_BY_ORDER = "readIdsByOrder";
const EVENT_READ_STATUS = "readStatus";

export const MonsterStatusEvent = Object.freeze({
  ENSURE_READY: EVENT_ENSURE_READY,
  REPAIR: EVENT_REPAIR,
  RECORD_SPAWN_ROSTER: EVENT_RECORD_SPAWN_ROSTER,
  UPDATE_HP: EVENT_UPDATE_HP,
  REFRESH_COMBATANT_COUNTS: EVENT_REFRESH_COMBATANT_COUNTS,
  READ_COMBATANT_COUNTS: EVENT_READ_COMBATANT_COUNTS,
  READ_IDS_BY_ORDER: EVENT_READ_IDS_BY_ORDER,
  READ_STATUS: EVENT_READ_STATUS,
});

function reloadCurrentPage() {
  runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW });
}

function refreshCombatantCounts() {
  const monsterAll = gE("div.btm1", "all").length;
  const monsterDead = gE('img[src*="nbardead"]', "all").length;
  const bossAll = gE('div.btm2[style^="background"]', "all").length;
  const bossDead = gE('div.btm1[style*="opacity"] div.btm2[style*="background"]', "all").length;
  g("monsterAll", monsterAll);
  g("monsterAlive", monsterAll - monsterDead);
  g("bossAll", bossAll);
  g("bossAlive", bossAll - bossDead);
  return {
    monsterAll,
    monsterAlive: monsterAll - monsterDead,
    bossAll,
    bossAlive: bossAll - bossDead,
  };
}

function readCombatantCounts() {
  return {
    monsterAll: g("monsterAll"),
    monsterAlive: g("monsterAlive"),
    bossAll: g("bossAll"),
    bossAlive: g("bossAlive"),
  };
}

function recordSpawnRoster(event) {
  const { roster } = parseMonsterRoster(event.battleLog, event.monsterAll ?? g("monsterAll"));
  const monsterStatus = buildMonsterStatus(roster);
  setValue(STORAGE_KEYS.MONSTER_STATUS, monsterStatus);
  g("monsterStatus", monsterStatus);
}

function repairMonsterStatus() {
  const battleLog = gE("#textlog>tbody>tr>td", "all");
  const monsterAll = gE("div.btm2", "all").length;
  const hasInit =
    battleLog.length && /Initializing/.test(battleLog[battleLog.length - 1].textContent);

  if (hasInit) {
    const { roster } = parseMonsterRoster(battleLog, monsterAll);
    setValue(STORAGE_KEYS.MONSTER_STATUS, buildMonsterStatus(roster));
    reloadCurrentPage();
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
  setValue(STORAGE_KEYS.MONSTER_STATUS, monsterStatus);
  reloadCurrentPage();
}

function ensureMonsterStatusReady() {
  const persisted = getValue(STORAGE_KEYS.MONSTER_STATUS, true);
  if (persisted && persisted.length === g("monsterAll")) {
    g("monsterStatus", persisted);
    return false;
  }
  repairMonsterStatus();
  return true;
}

function readMonsterIdsByOrder() {
  const idByOrder = new Map(
    (g("monsterStatus") || []).map((status) => [status.order, status.monsterId])
  );
  return (order) => idByOrder.get(order);
}

function readMonsterStatus() {
  return g("monsterStatus") || [];
}

export function runMonsterStatusAutomation(event = { type: EVENT_ENSURE_READY }) {
  if (event.type === EVENT_ENSURE_READY) {
    return ensureMonsterStatusReady();
  } else if (event.type === EVENT_REPAIR) {
    repairMonsterStatus();
  } else if (event.type === EVENT_RECORD_SPAWN_ROSTER) {
    recordSpawnRoster(event);
  } else if (event.type === EVENT_UPDATE_HP) {
    updateMonsterHpRuntime();
  } else if (event.type === EVENT_REFRESH_COMBATANT_COUNTS) {
    return refreshCombatantCounts();
  } else if (event.type === EVENT_READ_COMBATANT_COUNTS) {
    return readCombatantCounts();
  } else if (event.type === EVENT_READ_IDS_BY_ORDER) {
    return readMonsterIdsByOrder();
  } else if (event.type === EVENT_READ_STATUS) {
    return readMonsterStatus();
  }
  return false;
}
