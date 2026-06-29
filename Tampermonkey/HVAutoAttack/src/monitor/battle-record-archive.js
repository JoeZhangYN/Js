import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { getValue, setValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import {
  clearDropReportRecordSet,
  readOrCreateDropRecord,
  readDropReportSource,
  storeOrArchiveDropRecord,
} from "./battle-record-archive-drop-records.js";
import {
  clearUsageReportRecordSet,
  readOrCreateUsageStats,
  readUsageReportSource,
  readUsageStats,
  storeOrArchiveUsageStats,
  storeUsageStats,
} from "./battle-record-archive-usage-records.js";

export const BattleRecordArchiveEvent = Object.freeze({
  START_BATTLE_REPORT_RECORDING: "startBattleReportRecording",
  READ_OR_CREATE_DROP_RECORD: "readOrCreateDropRecord",
  STORE_OR_ARCHIVE_DROP_RECORD: "storeOrArchiveDropRecord",
  READ_OR_CREATE_USAGE_STATS: "readOrCreateUsageStats",
  READ_USAGE_STATS: "readUsageStats",
  STORE_USAGE_STATS: "storeUsageStats",
  STORE_OR_ARCHIVE_USAGE_STATS: "storeOrArchiveUsageStats",
  READ_DROP_REPORT_SOURCE: "readDropReportSource",
  READ_USAGE_REPORT_SOURCE: "readUsageReportSource",
  CLEAR_DROP_REPORT: "clearDropReport",
  CLEAR_USAGE_REPORT: "clearUsageReport",
});

const REPORT_RECORD_NAME_FIELD = "__name";

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
    currentName: readCurrentBattleReportName(deps),
    currentRaw: deps.getValue(event.currentKey, true),
    history: deps.getValue(event.historyKey, true) || [],
  };
}

function readCurrentBattleReportName(deps) {
  return deps.getValue(STORAGE_KEYS.BATTLE_CODE);
}

function startBattleReportRecording(event, deps) {
  if (!event.enabled || readCurrentBattleReportName(deps)) return false;
  deps.setValue(STORAGE_KEYS.BATTLE_CODE, event.code);
  return true;
}

function nameArchivedBattleReportRecord(record, deps) {
  return {
    ...record,
    [REPORT_RECORD_NAME_FIELD]: readCurrentBattleReportName(deps),
  };
}

function storeOrArchiveRecord(event, deps) {
  if (!shouldArchive(event)) {
    deps.setValue(event.currentKey, event.record);
    return { archived: false };
  }

  const history = deps.getValue(event.historyKey, true) || [];
  const archived = nameArchivedBattleReportRecord(event.record, deps);
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

function makeRecordStore(deps) {
  return {
    clearRecordSet: (event) => clearRecordSet(event, deps),
    readCurrentRecord: (event) => readCurrentRecord(event, deps),
    readOrCreateCurrentRecord: (event) => readOrCreateCurrentRecord(event, deps),
    readRecordSet: (event) => readRecordSet(event, deps),
    storeOrArchiveRecord: (event) => storeOrArchiveRecord(event, deps),
  };
}

export function runBattleRecordArchiveAutomation(event, deps = {}) {
  const fullDeps = makeDeps(deps);
  const recordStore = makeRecordStore(fullDeps);
  if (event.type === BattleRecordArchiveEvent.READ_OR_CREATE_DROP_RECORD)
    return readOrCreateDropRecord(recordStore);
  if (event.type === BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD) {
    return storeOrArchiveDropRecord(event, recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.READ_OR_CREATE_USAGE_STATS)
    return readOrCreateUsageStats(recordStore);
  if (event.type === BattleRecordArchiveEvent.READ_USAGE_STATS) return readUsageStats(recordStore);
  if (event.type === BattleRecordArchiveEvent.STORE_USAGE_STATS)
    return storeUsageStats(event, recordStore);
  if (event.type === BattleRecordArchiveEvent.STORE_OR_ARCHIVE_USAGE_STATS) {
    return storeOrArchiveUsageStats(event, recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.READ_DROP_REPORT_SOURCE) {
    return readDropReportSource(recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.READ_USAGE_REPORT_SOURCE) {
    return readUsageReportSource(recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.CLEAR_DROP_REPORT) {
    return clearDropReportRecordSet(recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.CLEAR_USAGE_REPORT) {
    return clearUsageReportRecordSet(recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING)
    return startBattleReportRecording(event, fullDeps);
  return undefined;
}
