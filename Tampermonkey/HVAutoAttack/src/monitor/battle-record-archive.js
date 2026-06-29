import { dropRecordArchiveFamily } from "./battle-record-archive-drop-records.js";
import { createBattleRecordArchiveStore } from "./battle-record-archive-store.js";
import { usageRecordArchiveFamily } from "./battle-record-archive-usage-records.js";

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

const archiveEventHandlers = Object.freeze({
  [BattleRecordArchiveEvent.READ_OR_CREATE_DROP_RECORD]: (_event, recordStore) =>
    dropRecordArchiveFamily.readOrCreateDropRecord(recordStore),
  [BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD]: (event, recordStore) =>
    dropRecordArchiveFamily.storeOrArchiveDropRecord(event, recordStore),
  [BattleRecordArchiveEvent.READ_OR_CREATE_USAGE_STATS]: (_event, recordStore) =>
    usageRecordArchiveFamily.readOrCreateUsageStats(recordStore),
  [BattleRecordArchiveEvent.READ_USAGE_STATS]: (_event, recordStore) =>
    usageRecordArchiveFamily.readUsageStats(recordStore),
  [BattleRecordArchiveEvent.STORE_USAGE_STATS]: (event, recordStore) =>
    usageRecordArchiveFamily.storeUsageStats(event, recordStore),
  [BattleRecordArchiveEvent.STORE_OR_ARCHIVE_USAGE_STATS]: (event, recordStore) =>
    usageRecordArchiveFamily.storeOrArchiveUsageStats(event, recordStore),
  [BattleRecordArchiveEvent.READ_DROP_REPORT_SOURCE]: (_event, recordStore) =>
    dropRecordArchiveFamily.readDropReportSource(recordStore),
  [BattleRecordArchiveEvent.READ_USAGE_REPORT_SOURCE]: (_event, recordStore) =>
    usageRecordArchiveFamily.readUsageReportSource(recordStore),
  [BattleRecordArchiveEvent.CLEAR_DROP_REPORT]: (_event, recordStore) =>
    dropRecordArchiveFamily.clearDropReportRecordSet(recordStore),
  [BattleRecordArchiveEvent.CLEAR_USAGE_REPORT]: (_event, recordStore) =>
    usageRecordArchiveFamily.clearUsageReportRecordSet(recordStore),
  [BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING]: (event, recordStore) =>
    recordStore.startBattleReportRecording(event),
});

export function runBattleRecordArchiveAutomation(event, deps = {}) {
  const recordStore = createBattleRecordArchiveStore(deps);
  return archiveEventHandlers[event.type]?.(event, recordStore);
}
