import { getKeys, objSort } from "../core/obj.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";

const USAGE_SECTIONS = ["self", "restore", "items", "magic", "damage", "hurt", "proficiency"];

function withCurrentRecord(history, current, currentName) {
  const rows = [...history];
  if (current && Object.keys(current).length) {
    rows.push({ ...current, __name: currentName });
  }
  return rows.reverse();
}

function readReportRecordSet(type, normalizeCurrent = (record) => record) {
  const { currentName, currentRaw, history } = runBattleRecordArchiveAutomation({ type });
  let current = normalizeCurrent(currentRaw || {});
  if (history.length === 0 || (history.length === 1 && !currentRaw)) {
    if (history.length === 1) current = history[0];
    return { mode: "single", current };
  }
  return { mode: "history", records: withCurrentRecord(history, current, currentName) };
}

export function readDropReportModel() {
  const recordSet = readReportRecordSet(BattleRecordArchiveEvent.READ_DROP_REPORT_SOURCE, objSort);
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

export function readUsageReportModel() {
  const recordSet = readReportRecordSet(BattleRecordArchiveEvent.READ_USAGE_REPORT_SOURCE);
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
