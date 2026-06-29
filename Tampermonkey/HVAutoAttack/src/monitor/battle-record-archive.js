import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { getValue, setValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import {
  clearDropReportRecordSet,
  clearUsageReportRecordSet,
  readOrCreateDropRecord,
  readOrCreateUsageStats,
  readDropReportRecordSet,
  readUsageReportRecordSet,
  readUsageStats,
  storeOrArchiveDropRecord,
  storeOrArchiveUsageStats,
  storeUsageStats,
} from "./battle-record-archive-records.js";

export const BattleRecordArchiveEvent = Object.freeze({
  START_BATTLE_REPORT_RECORDING: "startBattleReportRecording",
  READ_OR_CREATE_DROP_RECORD: "readOrCreateDropRecord",
  STORE_OR_ARCHIVE_DROP_RECORD: "storeOrArchiveDropRecord",
  READ_OR_CREATE_USAGE_STATS: "readOrCreateUsageStats",
  READ_USAGE_STATS: "readUsageStats",
  STORE_USAGE_STATS: "storeUsageStats",
  STORE_OR_ARCHIVE_USAGE_STATS: "storeOrArchiveUsageStats",
  READ_DROP_REPORT_RECORD_SET: "readDropReportRecordSet",
  READ_USAGE_REPORT_RECORD_SET: "readUsageReportRecordSet",
  CLEAR_DROP_REPORT_RECORD_SET: "clearDropReportRecordSet",
  CLEAR_USAGE_REPORT_RECORD_SET: "clearUsageReportRecordSet",
});

function makeDeps(deps) {
  return {
    delValue: deps.delValue || delValue,
    getValue: deps.getValue || getValue,
    setValue: deps.setValue || setValue,
    readLocalTimestampLabel:
      deps.readLocalTimestampLabel ||
      (() => runTimeAutomation({ type: TimeEvent.LOCAL_TIMESTAMP_LABEL })),
  };
}

function shouldArchive({ recordEach, roundNow, roundAll }) {
  return Boolean(recordEach && roundNow === roundAll);
}

function writePath(record, path, value) {
  const parts = String(path).split(".");
  let target = record;
  for (const part of parts.slice(0, -1)) {
    target[part] = target[part] || {};
    target = target[part];
  }
  target[parts.at(-1)] = value;
}

function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record || {}));
}

function readOrCreateCurrentRecord(event, deps) {
  const current = deps.getValue(event.currentKey, true);
  if (current) return current;
  const record = cloneRecord(event.defaultRecord);
  if (event.startTimeField) writePath(record, event.startTimeField, deps.readLocalTimestampLabel());
  return record;
}

function readCurrentRecord(event, deps) {
  return deps.getValue(event.currentKey, true) || null;
}

function readRecordSet(event, deps) {
  return {
    currentName: deps.getValue(STORAGE_KEYS.BATTLE_CODE),
    currentRaw: deps.getValue(event.currentKey, true),
    history: deps.getValue(event.historyKey, true) || [],
  };
}

function startBattleReportRecording(event, deps) {
  if (!event.enabled || deps.getValue(STORAGE_KEYS.BATTLE_CODE)) return false;
  deps.setValue(STORAGE_KEYS.BATTLE_CODE, event.code);
  return true;
}

function storeOrArchiveRecord(event, deps) {
  if (!shouldArchive(event)) {
    deps.setValue(event.currentKey, event.record);
    return { archived: false };
  }

  const history = deps.getValue(event.historyKey, true) || [];
  const archived = {
    ...event.record,
    __name: deps.getValue(STORAGE_KEYS.BATTLE_CODE),
  };
  if (event.endTimeField) writePath(archived, event.endTimeField, deps.readLocalTimestampLabel());
  history.push(archived);
  deps.setValue(event.historyKey, history);
  deps.delValue(event.currentKey);
  return { archived: true, record: archived };
}

function clearRecordSet(event, deps) {
  deps.delValue(event.currentKey);
  deps.delValue(event.historyKey);
  return true;
}

export function runBattleRecordArchiveAutomation(event, deps = {}) {
  const fullDeps = makeDeps(deps);
  const ops = {
    clearRecordSet,
    readCurrentRecord,
    readOrCreateCurrentRecord,
    readRecordSet,
    storeOrArchiveRecord,
  };
  if (event.type === BattleRecordArchiveEvent.READ_OR_CREATE_DROP_RECORD)
    return readOrCreateDropRecord(ops, fullDeps);
  if (event.type === BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD) {
    return storeOrArchiveDropRecord(event, ops, fullDeps);
  }
  if (event.type === BattleRecordArchiveEvent.READ_OR_CREATE_USAGE_STATS)
    return readOrCreateUsageStats(ops, fullDeps);
  if (event.type === BattleRecordArchiveEvent.READ_USAGE_STATS)
    return readUsageStats(ops, fullDeps);
  if (event.type === BattleRecordArchiveEvent.STORE_USAGE_STATS)
    return storeUsageStats(event, ops, fullDeps);
  if (event.type === BattleRecordArchiveEvent.STORE_OR_ARCHIVE_USAGE_STATS) {
    return storeOrArchiveUsageStats(event, ops, fullDeps);
  }
  if (event.type === BattleRecordArchiveEvent.READ_DROP_REPORT_RECORD_SET) {
    return readDropReportRecordSet(ops, fullDeps);
  }
  if (event.type === BattleRecordArchiveEvent.READ_USAGE_REPORT_RECORD_SET) {
    return readUsageReportRecordSet(ops, fullDeps);
  }
  if (event.type === BattleRecordArchiveEvent.CLEAR_DROP_REPORT_RECORD_SET) {
    return clearDropReportRecordSet(ops, fullDeps);
  }
  if (event.type === BattleRecordArchiveEvent.CLEAR_USAGE_REPORT_RECORD_SET) {
    return clearUsageReportRecordSet(ops, fullDeps);
  }
  if (event.type === BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING)
    return startBattleReportRecording(event, fullDeps);
  return undefined;
}
