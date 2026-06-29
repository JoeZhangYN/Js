import { STORAGE_KEYS } from "../state/persist-keys.js";
import { createDefaultUsageStats } from "./record-usage-default-stats.js";

function readOrCreateUsageStats(recordStore) {
  return recordStore.readOrCreateCurrentRecord({
    currentKey: STORAGE_KEYS.STATS,
    defaultRecord: createDefaultUsageStats(),
    startTimeField: "self._startTime",
  });
}

function readUsageStats(recordStore) {
  return recordStore.readCurrentRecord({ currentKey: STORAGE_KEYS.STATS });
}

function storeUsageStats(event, recordStore) {
  return recordStore.storeOrArchiveRecord({
    currentKey: STORAGE_KEYS.STATS,
    historyKey: STORAGE_KEYS.STATS_OLD,
    record: event.record,
    recordEach: false,
  });
}

function storeOrArchiveUsageStats(event, recordStore) {
  return recordStore.storeOrArchiveRecord({
    currentKey: STORAGE_KEYS.STATS,
    historyKey: STORAGE_KEYS.STATS_OLD,
    record: event.record,
    endTimeField: "self._endTime",
    recordEach: event.recordEach,
    roundNow: event.roundNow,
    roundAll: event.roundAll,
  });
}

function readUsageReportSource(recordStore) {
  return recordStore.readRecordSet({
    currentKey: STORAGE_KEYS.STATS,
    historyKey: STORAGE_KEYS.STATS_OLD,
  });
}

function clearUsageReportRecordSet(recordStore) {
  return recordStore.clearRecordSet({
    currentKey: STORAGE_KEYS.STATS,
    historyKey: STORAGE_KEYS.STATS_OLD,
  });
}

export const usageRecordArchiveFamily = Object.freeze({
  clearUsageReportRecordSet,
  readOrCreateUsageStats,
  readUsageReportSource,
  readUsageStats,
  storeOrArchiveUsageStats,
  storeUsageStats,
});
