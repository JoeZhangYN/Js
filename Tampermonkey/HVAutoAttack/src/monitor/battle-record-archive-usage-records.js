import { STORAGE_KEYS } from "../state/persist-keys.js";
import { createDefaultUsageStats } from "./record-usage-default-stats.js";

export function readOrCreateUsageStats(recordStore) {
  return recordStore.readOrCreateCurrentRecord({
    currentKey: STORAGE_KEYS.STATS,
    defaultRecord: createDefaultUsageStats(),
    startTimeField: "self._startTime",
  });
}

export function readUsageStats(recordStore) {
  return recordStore.readCurrentRecord({ currentKey: STORAGE_KEYS.STATS });
}

export function storeUsageStats(event, recordStore) {
  return recordStore.storeOrArchiveRecord({
    currentKey: STORAGE_KEYS.STATS,
    historyKey: STORAGE_KEYS.STATS_OLD,
    record: event.record,
    recordEach: false,
  });
}

export function storeOrArchiveUsageStats(event, recordStore) {
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

export function readUsageReportSource(recordStore) {
  return recordStore.readRecordSet({
    currentKey: STORAGE_KEYS.STATS,
    historyKey: STORAGE_KEYS.STATS_OLD,
  });
}

export function clearUsageReportRecordSet(recordStore) {
  return recordStore.clearRecordSet({
    currentKey: STORAGE_KEYS.STATS,
    historyKey: STORAGE_KEYS.STATS_OLD,
  });
}
