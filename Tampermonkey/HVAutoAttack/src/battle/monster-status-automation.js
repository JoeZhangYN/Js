// 怪物状态生命周期入口：持久态恢复、异常修复、每 turn HP/权重更新统一从这里进入。
import { setValue, getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { parseMonsterRoster, buildMonsterStatus } from "./log-parser.js";
import { updateMonsterHpRuntime } from "./monster-status-hp.js";
import { MonsterStatusViewEvent, runMonsterStatusView } from "./monster-status-view.js";
import { BattleRoundStartLogEvent, runBattleRoundStartLog } from "./round-start-log.js";

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

const monsterStatusEventHandlers = Object.freeze({
  [EVENT_ENSURE_READY]: () => ensureMonsterStatusReady(),
  [EVENT_REPAIR]: () => repairMonsterStatus(),
  [EVENT_PREPARE_ROUND_START]: (event) => prepareRoundStart(event),
  [EVENT_UPDATE_HP]: () => updateMonsterHpRuntime(),
  [EVENT_REFRESH_COMBATANT_COUNTS]: () => refreshCombatantCounts(),
  [EVENT_READ_COMBATANT_COUNTS]: () => readCombatantCounts(),
  [EVENT_READ_IDS_BY_ORDER]: () => readMonsterIdsByOrder(),
  [EVENT_READ_STATUS]: () => readMonsterStatus(),
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
  const { monsterAll, monsterDead, bossAll, bossDead } = runMonsterStatusView({
    type: MonsterStatusViewEvent.READ_COMBATANT_COUNTS,
  });
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
  const { roster } = parseMonsterRoster(event.battleLogRows, event.monsterAll ?? g("monsterAll"));
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
  const battleLog = runBattleRoundStartLog({ type: BattleRoundStartLogEvent.READ_CURRENT });
  const repairSnapshot = runMonsterStatusView({
    type: MonsterStatusViewEvent.READ_REPAIR_SNAPSHOT,
  });
  const hasInit = battleLog.rows.length && /Initializing/.test(battleLog.initializingText);

  if (hasInit) {
    const { roster } = parseMonsterRoster(battleLog.rows, repairSnapshot.monsterAll);
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
  setValue(STORAGE_KEYS.MONSTER_STATUS, repairSnapshot.inferredStatus);
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
  return monsterStatusEventHandlers[event.type]?.(event) ?? false;
}
