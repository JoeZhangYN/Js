// 怪物状态生命周期入口：持久态恢复、异常修复、每 turn HP/权重更新统一从这里进入。
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { BattleLogParserEvent, runBattleLogParser } from "./battle-log-parser.js";
import { MonsterStatusHpRuntimeEvent, runMonsterStatusHpRuntime } from "./monster-status-hp.js";
import { MonsterStatusViewEvent, runMonsterStatusView } from "./monster-status-view.js";
import { BattleRoundStartLogEvent, runBattleRoundStartLog } from "./round-start-log.js";
import {
  MonsterStatusRepairEvidenceEvent,
  runMonsterStatusRepairEvidence,
} from "./monster-status-repair-evidence.js";
import { persistMonsterStatus } from "./monster-status-failure.js";

const EVENT_ENSURE_READY = "ensureReady";
const EVENT_REPAIR = "repair";
const EVENT_PREPARE_ROUND_START = "prepareRoundStart";
const EVENT_UPDATE_HP = "updateHp";
const EVENT_REFRESH_COMBATANT_COUNTS = "refreshCombatantCounts";
const EVENT_READ_COMBATANT_COUNTS = "readCombatantCounts";
const EVENT_READ_IDS_BY_ORDER = "readIdsByOrder";
const EVENT_READ_STATUS = "readStatus";
const EVENT_UNKNOWN_MONSTER_STATUS = "unknownMonsterStatusEvent",
  DEFAULT_COMBATANT_COUNT = 0,
  REPAIR_SOURCE_ROUND_START_LOG = "roundStartLog",
  REPAIR_SOURCE_RENDERED_SNAPSHOT = "renderedSnapshot";

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
  [EVENT_UPDATE_HP]: (event) =>
    runMonsterStatusHpRuntime({ ...event, type: MonsterStatusHpRuntimeEvent.UPDATE }),
  [EVENT_REFRESH_COMBATANT_COUNTS]: () => refreshCombatantCounts(),
  [EVENT_READ_COMBATANT_COUNTS]: () => readCombatantCounts(),
  [EVENT_READ_IDS_BY_ORDER]: () => readMonsterIdsByOrder(),
  [EVENT_READ_STATUS]: () => readMonsterStatus(),
});

function reloadCurrentPage(detail) {
  return runNavigationAutomation({
    type: NavigationEvent.RELOAD_NOW,
    reason: NavigationReloadReason.MONSTER_STATUS_REPAIR,
    detail,
  });
}

function reloadRepairDetail(detail) {
  try {
    return { ...detail, navigationResult: reloadCurrentPage(detail) };
  } catch (error) {
    return { ...detail, navigationResult: false, navigationError: error?.message || String(error) };
  }
}

function recordRepair(result, reason, detail) {
  runMonsterStatusRepairEvidence({
    type: MonsterStatusRepairEvidenceEvent.RECORD_REPAIR,
    result,
    reason,
    detail,
  });
}

function repairReloadDetail(repairSource, repairSnapshot) {
  return { source: "monsterStatusRepair", repairSource, monsterAll: repairSnapshot.monsterAll };
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
  const { roster } = runBattleLogParser({
    type: BattleLogParserEvent.PARSE_MONSTER_ROSTER,
    battleLogRows: event.battleLogRows,
    monsterAll: event.monsterAll ?? g("monsterAll"),
  });
  const monsterStatus = runBattleLogParser({
    type: BattleLogParserEvent.BUILD_MONSTER_STATUS,
    roster,
  });
  if (!persistMonsterStatus("spawn-roster", monsterStatus)) return false;
  g("monsterStatus", monsterStatus);
  return true;
}

function prepareRoundStart(event) {
  const initialized = Boolean(event?.initialized);
  if (initialized && !recordSpawnRoster(event)) {
    return { initialized, repaired: false, failed: true, reason: "monsterStatusPersistenceFailed" };
  }
  return {
    initialized,
    repaired: !initialized && ensureMonsterStatusReady(),
  };
}

function repairMonsterStatus() {
  const battleLog = runBattleRoundStartLog({ type: BattleRoundStartLogEvent.READ_CURRENT });
  const repairSnapshot = runMonsterStatusView({
    type: MonsterStatusViewEvent.READ_REPAIR_SNAPSHOT,
  });
  const hasInit = battleLog.rows.length && /Initializing/.test(battleLog.initializingText);

  if (hasInit) {
    const { roster } = runBattleLogParser({
      type: BattleLogParserEvent.PARSE_MONSTER_ROSTER,
      battleLogRows: battleLog.rows,
      monsterAll: repairSnapshot.monsterAll,
    });
    const monsterStatus = runBattleLogParser({
      type: BattleLogParserEvent.BUILD_MONSTER_STATUS,
      roster,
    });
    if (!persistMonsterStatus("repair-round-start-log", monsterStatus)) return false;
    const detail = repairReloadDetail(REPAIR_SOURCE_ROUND_START_LOG, repairSnapshot);
    recordRepair("scheduledReload", REPAIR_SOURCE_ROUND_START_LOG, reloadRepairDetail(detail));
    return true;
  }

  document.title = _alert(
    -1,
    "monsterStatus错误，正在尝试修复",
    "monsterStatus錯誤，正在嘗試修復",
    "monsterStatus Error, trying to fix"
  );
  if (!persistMonsterStatus("repair-rendered-snapshot", repairSnapshot.inferredStatus))
    return false;
  const detail = repairReloadDetail(REPAIR_SOURCE_RENDERED_SNAPSHOT, repairSnapshot);
  recordRepair("scheduledReload", REPAIR_SOURCE_RENDERED_SNAPSHOT, reloadRepairDetail(detail));
  return true;
}

function ensureMonsterStatusReady() {
  const persisted = getValue(STORAGE_KEYS.MONSTER_STATUS, true);
  if (persisted && persisted.length === g("monsterAll")) {
    g("monsterStatus", persisted);
    return false;
  }
  return repairMonsterStatus();
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
  const handler = monsterStatusEventHandlers[event?.type];
  if (handler) return handler(event);
  recordRepair("rejected", EVENT_UNKNOWN_MONSTER_STATUS, { eventType: event?.type ?? null });
  return false;
}
