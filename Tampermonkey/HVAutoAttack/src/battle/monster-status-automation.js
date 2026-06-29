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
const EVENT_PREPARE_ROUND_START = "prepareRoundStart";
const EVENT_UPDATE_HP = "updateHp";
const EVENT_REFRESH_COMBATANT_COUNTS = "refreshCombatantCounts";
const EVENT_READ_COMBATANT_COUNTS = "readCombatantCounts";
const EVENT_READ_IDS_BY_ORDER = "readIdsByOrder";
const EVENT_READ_STATUS = "readStatus";
const DEFAULT_COMBATANT_COUNT = 0;

export const MonsterStatusEvent = Object.freeze({
  ENSURE_READY: EVENT_ENSURE_READY,
  REPAIR: EVENT_REPAIR,
  PREPARE_ROUND_START: EVENT_PREPARE_ROUND_START,
  UPDATE_HP: EVENT_UPDATE_HP,
  REFRESH_COMBATANT_COUNTS: EVENT_REFRESH_COMBATANT_COUNTS,
  READ_COMBATANT_COUNTS: EVENT_READ_COMBATANT_COUNTS,
  READ_IDS_BY_ORDER: EVENT_READ_IDS_BY_ORDER,
  READ_STATUS: EVENT_READ_STATUS,
});

function reloadCurrentPage() {
  runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW });
}

function normalizeCombatantCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : DEFAULT_COMBATANT_COUNT;
}

function combatantCounts({ monsterAll, monsterAlive, bossAll, bossAlive }) {
  const normalizedMonsterAll = normalizeCombatantCount(monsterAll);
  const normalizedBossAll = normalizeCombatantCount(bossAll);
  return {
    monsterAll: normalizedMonsterAll,
    monsterAlive: Math.min(normalizeCombatantCount(monsterAlive), normalizedMonsterAll),
    bossAll: normalizedBossAll,
    bossAlive: Math.min(normalizeCombatantCount(bossAlive), normalizedBossAll),
  };
}

function refreshCombatantCounts() {
  const monsterAll = gE("div.btm1", "all").length;
  const monsterDead = gE('img[src*="nbardead"]', "all").length;
  const bossAll = gE('div.btm2[style^="background"]', "all").length;
  const bossDead = gE('div.btm1[style*="opacity"] div.btm2[style*="background"]', "all").length;
  const counts = combatantCounts({
    monsterAll,
    monsterAlive: monsterAll - monsterDead,
    bossAll,
    bossAlive: bossAll - bossDead,
  });
  g("monsterAll", counts.monsterAll);
  g("monsterAlive", counts.monsterAlive);
  g("bossAll", counts.bossAll);
  g("bossAlive", counts.bossAlive);
  return counts;
}

function readCombatantCounts() {
  return combatantCounts({
    monsterAll: g("monsterAll"),
    monsterAlive: g("monsterAlive"),
    bossAll: g("bossAll"),
    bossAlive: g("bossAlive"),
  });
}

function recordSpawnRoster(event) {
  const { roster } = parseMonsterRoster(event.battleLog, event.monsterAll ?? g("monsterAll"));
  const monsterStatus = buildMonsterStatus(roster);
  setValue(STORAGE_KEYS.MONSTER_STATUS, monsterStatus);
  g("monsterStatus", monsterStatus);
}

function prepareRoundStart(event) {
  if (event.initialized) recordSpawnRoster(event);
  return {
    initialized: event.initialized,
    repaired: !event.initialized && ensureMonsterStatusReady(),
  };
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
  } else if (event.type === EVENT_PREPARE_ROUND_START) {
    return prepareRoundStart(event);
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
