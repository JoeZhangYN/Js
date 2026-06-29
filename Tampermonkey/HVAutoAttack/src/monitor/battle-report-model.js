import { getKeys, objSort } from "../core/obj.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";

const USAGE_SECTIONS = ["self", "restore", "items", "magic", "damage", "hurt", "proficiency"];
const EVENT_READ_DROP_REPORT_MODEL = "readDropReportModel";
const EVENT_READ_USAGE_REPORT_MODEL = "readUsageReportModel";

export const BattleReportModelEvent = Object.freeze({
  READ_DROP_REPORT_MODEL: EVENT_READ_DROP_REPORT_MODEL,
  READ_USAGE_REPORT_MODEL: EVENT_READ_USAGE_REPORT_MODEL,
});

function withCurrentRecord(history, current, currentName) {
  const rows = [...history];
  if (current && Object.keys(current).length) {
    rows.push({ ...current, __name: currentName });
  }
  return rows.reverse();
}

function readReportSource(type, normalizeCurrent = (record) => record) {
  const { currentName, currentRaw, history } = runBattleRecordArchiveAutomation({ type });
  let current = normalizeCurrent(currentRaw || {});
  if (history.length === 0 || (history.length === 1 && !currentRaw)) {
    if (history.length === 1) current = history[0];
    return { mode: "single", current };
  }
  return { mode: "history", records: withCurrentRecord(history, current, currentName) };
}

function readDropReportModel() {
  const reportSource = readReportSource(BattleRecordArchiveEvent.READ_DROP_REPORT_SOURCE, objSort);
  if (reportSource.mode === "single") {
    return {
      mode: "single",
      rows: Object.entries(reportSource.current).map(([key, value]) => ({ key, value })),
    };
  }
  return {
    mode: "history",
    columns: reportSource.records.map((record) => record.__name),
    rows: getKeys(reportSource.records)
      .filter((key) => key !== "__name")
      .map((key) => ({
        key,
        values: reportSource.records.map((record) => (key in record ? record[key] : "")),
      })),
  };
}

function readUsageReportModel() {
  const reportSource = readReportSource(BattleRecordArchiveEvent.READ_USAGE_REPORT_SOURCE);
  if (reportSource.mode === "single") {
    return {
      mode: "single",
      sections: USAGE_SECTIONS.map((section) => ({
        key: section,
        rows: Object.entries(objSort(reportSource.current[section] || {})).map(
          ([name, amount]) => ({
            key: name,
            value: amount,
          })
        ),
      })),
    };
  }
  return {
    mode: "history",
    columns: reportSource.records.map((record) => record.__name),
    sections: USAGE_SECTIONS.map((section) => ({
      key: section,
      rows: getKeys(reportSource.records.map((record) => record[section] || {})).map((key) => ({
        key,
        values: reportSource.records.map((record) => {
          const values = record[section] || {};
          return key in values ? values[key] : "";
        }),
      })),
    })),
  };
}

const reportModelEventHandlers = Object.freeze({
  [EVENT_READ_DROP_REPORT_MODEL]: () => readDropReportModel(),
  [EVENT_READ_USAGE_REPORT_MODEL]: () => readUsageReportModel(),
});

export function runBattleReportModel(event) {
  return reportModelEventHandlers[event.type]?.(event);
}
