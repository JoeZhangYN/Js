import { getKeys, objSort } from "../core/obj.js";
import { getValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { TimeEvent, runTimeAutomation } from "../core/time.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { BattleReportViewEvent, runBattleReportViewAutomation } from "./battle-report-view.js";
import { BattleMonitorRuntimeEvent, runBattleMonitorRuntime } from "./battle-monitor-runtime.js";

const USAGE_SECTIONS = ["self", "restore", "items", "magic", "damage", "hurt", "proficiency"];

export const BattleReportEvent = Object.freeze({
  BATTLE_STARTED: "battleStarted",
  READ_DROP_REPORT: "readDropReport",
  READ_USAGE_REPORT: "readUsageReport",
  CLEAR_DROP_REPORT: "clearDropReport",
  CLEAR_USAGE_REPORT: "clearUsageReport",
  RENDER_DROP_REPORT_TABLE_BODY: "renderDropReportTableBody",
  RENDER_USAGE_REPORT_TABLE_BODY: "renderUsageReportTableBody",
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

function readBattleReportStartContext(deps) {
  return (
    deps.readStartContext ||
    (() => runBattleMonitorRuntime({ type: BattleMonitorRuntimeEvent.REPORT_START_CONTEXT }))
  )();
}

function recordBattleReportStarted(deps) {
  const { recordEach, roundType, roundAll } = readBattleReportStartContext(deps);
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

function clearReportRecordSet(currentKey, historyKey) {
  runBattleRecordArchiveAutomation({
    type: BattleRecordArchiveEvent.CLEAR_RECORD_SET,
    currentKey,
    historyKey,
  });
}

function renderReportTableBody(type, report) {
  return runBattleReportViewAutomation({ type, report });
}

export function runBattleReportAutomation(event, deps = {}) {
  if (event.type === BattleReportEvent.BATTLE_STARTED) {
    return recordBattleReportStarted(deps);
  }
  if (event.type === BattleReportEvent.READ_DROP_REPORT) {
    return readDropReport();
  }
  if (event.type === BattleReportEvent.READ_USAGE_REPORT) {
    return readUsageReport();
  }
  if (event.type === BattleReportEvent.RENDER_DROP_REPORT_TABLE_BODY) {
    return renderReportTableBody(BattleReportViewEvent.RENDER_DROP_TABLE_BODY, readDropReport());
  }
  if (event.type === BattleReportEvent.RENDER_USAGE_REPORT_TABLE_BODY) {
    return renderReportTableBody(BattleReportViewEvent.RENDER_USAGE_TABLE_BODY, readUsageReport());
  }
  if (event.type === BattleReportEvent.CLEAR_DROP_REPORT) {
    clearReportRecordSet(STORAGE_KEYS.DROP, STORAGE_KEYS.DROP_OLD);
    return undefined;
  }
  if (event.type === BattleReportEvent.CLEAR_USAGE_REPORT) {
    clearReportRecordSet(STORAGE_KEYS.STATS, STORAGE_KEYS.STATS_OLD);
    return undefined;
  }
  return undefined;
}
