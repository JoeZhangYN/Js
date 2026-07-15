import { createDefaultUsageStats } from "./record-usage-default-stats.js";
import { BattleReportCheckpointMode } from "./battle-record-archive-store.js";
import { BattleReportFamily } from "./battle-report-history.js";

function readOrCreateUsageStats(recordStore) {
  return recordStore.readOrCreateCurrentRecord({
    family: BattleReportFamily.USAGE,
    defaultRecord: createDefaultUsageStats(),
    startTimeField: "self._startTime",
  });
}

function readUsageStats(recordStore) {
  return recordStore.readCurrentRecord({ family: BattleReportFamily.USAGE });
}

function storeUsageStats(event, recordStore) {
  return recordStore.storeOrArchiveRecord({
    family: BattleReportFamily.USAGE,
    record: event.record,
    recordEach: false,
    checkpointMode: BattleReportCheckpointMode.MEMORY_ONLY,
  });
}

function storeOrArchiveUsageStats(event, recordStore) {
  return recordStore.storeOrArchiveRecord({
    family: BattleReportFamily.USAGE,
    record: event.record,
    endTimeField: "self._endTime",
    recordEach: event.recordEach,
    roundNow: event.roundNow,
    roundAll: event.roundAll,
    checkpointMode: BattleReportCheckpointMode.ROUND_BOUNDARY,
  });
}

function readUsageReportSource(recordStore) {
  return recordStore.readRecordSet({
    family: BattleReportFamily.USAGE,
  });
}

function clearUsageReportRecordSet(recordStore) {
  return recordStore.clearRecordSet({
    family: BattleReportFamily.USAGE,
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
