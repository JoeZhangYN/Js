import { getKeys, objSort } from "../core/obj.js";
import { getValue, setValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { TimeEvent, runTimeAutomation } from "../core/time.js";

const USAGE_SECTIONS = ["self", "restore", "items", "magic", "damage", "hurt", "proficiency"];
const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_READ_DROP_REPORT = "readDropReport";
const EVENT_READ_USAGE_REPORT = "readUsageReport";
const EVENT_CLEAR_DROP_REPORT = "clearDropReport";
const EVENT_CLEAR_USAGE_REPORT = "clearUsageReport";

export const BattleReportEvent = Object.freeze({
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
  READ_DROP_REPORT: EVENT_READ_DROP_REPORT,
  READ_USAGE_REPORT: EVENT_READ_USAGE_REPORT,
  CLEAR_DROP_REPORT: EVENT_CLEAR_DROP_REPORT,
  CLEAR_USAGE_REPORT: EVENT_CLEAR_USAGE_REPORT,
});

function withCurrentRecord(history, current) {
  const rows = [...history];
  if (current && Object.keys(current).length) {
    rows.push({ ...current, __name: getValue(STORAGE_KEYS.BATTLE_CODE) });
  }
  return rows.reverse();
}

function readBattleReportRecordLabel(deps) {
  return (
    deps.readRecordLabel || (() => runTimeAutomation({ type: TimeEvent.UTC_MONTH_DAY_LABEL }))
  )();
}

function recordBattleReportStarted({ recordEach, roundType, roundAll }, deps) {
  if (!recordEach || getValue(STORAGE_KEYS.BATTLE_CODE)) return false;
  const recordLabel = readBattleReportRecordLabel(deps);
  setValue(STORAGE_KEYS.BATTLE_CODE, `${recordLabel}: ${roundType.toUpperCase()}-${roundAll}`);
  return true;
}

function readDropReport() {
  let current = objSort(getValue(STORAGE_KEYS.DROP, true) || {});
  const history = getValue(STORAGE_KEYS.DROP_OLD, true) || [];
  if (history.length === 0 || (history.length === 1 && !getValue(STORAGE_KEYS.DROP, true))) {
    if (history.length === 1) current = history[0];
    return {
      mode: "single",
      rows: Object.entries(current).map(([key, value]) => ({ key, value })),
    };
  }
  const records = withCurrentRecord(history, current);
  return {
    mode: "history",
    columns: records.map((record) => record.__name),
    rows: getKeys(records)
      .filter((key) => key !== "__name")
      .map((key) => ({
        key,
        values: records.map((record) => (key in record ? record[key] : "")),
      })),
  };
}

function readUsageReport() {
  let current = getValue(STORAGE_KEYS.STATS, true) || {};
  const history = getValue(STORAGE_KEYS.STATS_OLD, true) || [];
  if (history.length === 0 || (history.length === 1 && !getValue(STORAGE_KEYS.STATS, true))) {
    if (history.length === 1) current = history[0];
    return {
      mode: "single",
      sections: USAGE_SECTIONS.map((section) => ({
        key: section,
        rows: Object.entries(objSort(current[section] || {})).map(([name, amount]) => ({
          key: name,
          value: amount,
        })),
      })),
    };
  }
  const records = withCurrentRecord(history, current);
  return {
    mode: "history",
    columns: records.map((record) => record.__name),
    sections: USAGE_SECTIONS.map((section) => ({
      key: section,
      rows: getKeys(records.map((record) => record[section] || {})).map((key) => ({
        key,
        values: records.map((record) => {
          const values = record[section] || {};
          return key in values ? values[key] : "";
        }),
      })),
    })),
  };
}

function clearDropReport() {
  delValue(STORAGE_KEYS.DROP);
  delValue(STORAGE_KEYS.DROP_OLD);
}

function clearUsageReport() {
  delValue(STORAGE_KEYS.STATS);
  delValue(STORAGE_KEYS.STATS_OLD);
}

export function runBattleReportAutomation(event, deps = {}) {
  if (event.type === EVENT_BATTLE_STARTED) {
    return recordBattleReportStarted(event, deps);
  }
  if (event.type === EVENT_READ_DROP_REPORT) {
    return readDropReport();
  }
  if (event.type === EVENT_READ_USAGE_REPORT) {
    return readUsageReport();
  }
  if (event.type === EVENT_CLEAR_DROP_REPORT) {
    clearDropReport();
    return undefined;
  }
  if (event.type === EVENT_CLEAR_USAGE_REPORT) {
    clearUsageReport();
    return undefined;
  }
  return undefined;
}
