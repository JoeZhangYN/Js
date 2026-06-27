import { getKeys, objSort } from "../core/obj.js";
import { getValue, delValue } from "../state/storage.js";

const DROP_KEY = "drop";
const DROP_OLD_KEY = "dropOld";
const STATS_KEY = "stats";
const STATS_OLD_KEY = "statsOld";
const BATTLE_CODE_KEY = "battleCode";
const USAGE_SECTIONS = ["self", "restore", "items", "magic", "damage", "hurt", "proficiency"];

function withCurrentRecord(history, current) {
  const rows = [...history];
  if (current && Object.keys(current).length) {
    rows.push({ ...current, __name: getValue(BATTLE_CODE_KEY) });
  }
  return rows.reverse();
}

export function readDropReport() {
  let current = objSort(getValue(DROP_KEY, true) || {});
  const history = getValue(DROP_OLD_KEY, true) || [];
  if (history.length === 0 || (history.length === 1 && !getValue(DROP_KEY, true))) {
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

export function readUsageReport() {
  let current = getValue(STATS_KEY, true) || {};
  const history = getValue(STATS_OLD_KEY, true) || [];
  if (history.length === 0 || (history.length === 1 && !getValue(STATS_KEY, true))) {
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

export function clearDropReport() {
  delValue(DROP_KEY);
  delValue(DROP_OLD_KEY);
}

export function clearUsageReport() {
  delValue(STATS_KEY);
  delValue(STATS_OLD_KEY);
}
