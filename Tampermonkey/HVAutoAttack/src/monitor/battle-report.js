import { getKeys, objSort } from "../core/obj.js";
import { getValue, setValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";

const USAGE_SECTIONS = ["self", "restore", "items", "magic", "damage", "hurt", "proficiency"];

function withCurrentRecord(history, current) {
  const rows = [...history];
  if (current && Object.keys(current).length) {
    rows.push({ ...current, __name: getValue(STORAGE_KEYS.BATTLE_CODE) });
  }
  return rows.reverse();
}

function recordBattleReportStarted({ recordEach, roundType, roundAll, recordLabel }) {
  if (!recordEach || getValue(STORAGE_KEYS.BATTLE_CODE)) return false;
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

export function runBattleReportAutomation(event) {
  if (event.type === "battleStarted") {
    return recordBattleReportStarted(event);
  }
  if (event.type === "readDropReport") {
    return readDropReport();
  }
  if (event.type === "readUsageReport") {
    return readUsageReport();
  }
  if (event.type === "clearDropReport") {
    clearDropReport();
    return undefined;
  }
  if (event.type === "clearUsageReport") {
    clearUsageReport();
    return undefined;
  }
  return undefined;
}
