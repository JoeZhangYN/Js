import { getKeys, objSort } from "../core/obj.js";
import { getValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { TimeEvent, runTimeAutomation } from "../core/time.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";

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

function readReportRecordSet({ currentKey, historyKey, normalizeCurrent = (record) => record }) {
  const currentRaw = getValue(currentKey, true);
  let current = normalizeCurrent(currentRaw || {});
  const history = getValue(historyKey, true) || [];
  if (history.length === 0 || (history.length === 1 && !currentRaw)) {
    if (history.length === 1) current = history[0];
    return { mode: "single", current };
  }
  return { mode: "history", records: withCurrentRecord(history, current) };
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
  const recordSet = readReportRecordSet({
    currentKey: STORAGE_KEYS.DROP,
    historyKey: STORAGE_KEYS.DROP_OLD,
    normalizeCurrent: objSort,
  });
  if (recordSet.mode === "single") {
    return {
      mode: "single",
      rows: Object.entries(recordSet.current).map(([key, value]) => ({ key, value })),
    };
  }
  return {
    mode: "history",
    columns: recordSet.records.map((record) => record.__name),
    rows: getKeys(recordSet.records)
      .filter((key) => key !== "__name")
      .map((key) => ({
        key,
        values: recordSet.records.map((record) => (key in record ? record[key] : "")),
      })),
  };
}

function readUsageReport() {
  const recordSet = readReportRecordSet({
    currentKey: STORAGE_KEYS.STATS,
    historyKey: STORAGE_KEYS.STATS_OLD,
  });
  if (recordSet.mode === "single") {
    return {
      mode: "single",
      sections: USAGE_SECTIONS.map((section) => ({
        key: section,
        rows: Object.entries(objSort(recordSet.current[section] || {})).map(([name, amount]) => ({
          key: name,
          value: amount,
        })),
      })),
    };
  }
  return {
    mode: "history",
    columns: recordSet.records.map((record) => record.__name),
    sections: USAGE_SECTIONS.map((section) => ({
      key: section,
      rows: getKeys(recordSet.records.map((record) => record[section] || {})).map((key) => ({
        key,
        values: recordSet.records.map((record) => {
          const values = record[section] || {};
          return key in values ? values[key] : "";
        }),
      })),
    })),
  };
}

function clearDropReport() {
  runBattleRecordArchiveAutomation({
    type: BattleRecordArchiveEvent.CLEAR_RECORD_SET,
    currentKey: STORAGE_KEYS.DROP,
    historyKey: STORAGE_KEYS.DROP_OLD,
  });
}

function clearUsageReport() {
  runBattleRecordArchiveAutomation({
    type: BattleRecordArchiveEvent.CLEAR_RECORD_SET,
    currentKey: STORAGE_KEYS.STATS,
    historyKey: STORAGE_KEYS.STATS_OLD,
  });
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
