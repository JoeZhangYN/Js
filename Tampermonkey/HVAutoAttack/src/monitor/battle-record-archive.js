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

export function runBattleRecordArchiveAutomation(event, deps = {}) {
  const recordStore = createBattleRecordArchiveStore(deps);
  if (event.type === BattleRecordArchiveEvent.READ_OR_CREATE_DROP_RECORD)
    return dropRecordArchiveFamily.readOrCreateDropRecord(recordStore);
  if (event.type === BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD) {
    return dropRecordArchiveFamily.storeOrArchiveDropRecord(event, recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.READ_OR_CREATE_USAGE_STATS)
    return usageRecordArchiveFamily.readOrCreateUsageStats(recordStore);
  if (event.type === BattleRecordArchiveEvent.READ_USAGE_STATS)
    return usageRecordArchiveFamily.readUsageStats(recordStore);
  if (event.type === BattleRecordArchiveEvent.STORE_USAGE_STATS)
    return usageRecordArchiveFamily.storeUsageStats(event, recordStore);
  if (event.type === BattleRecordArchiveEvent.STORE_OR_ARCHIVE_USAGE_STATS) {
    return usageRecordArchiveFamily.storeOrArchiveUsageStats(event, recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.READ_DROP_REPORT_SOURCE) {
    return dropRecordArchiveFamily.readDropReportSource(recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.READ_USAGE_REPORT_SOURCE) {
    return usageRecordArchiveFamily.readUsageReportSource(recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.CLEAR_DROP_REPORT) {
    return dropRecordArchiveFamily.clearDropReportRecordSet(recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.CLEAR_USAGE_REPORT) {
    return usageRecordArchiveFamily.clearUsageReportRecordSet(recordStore);
  }
  if (event.type === BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING)
    return recordStore.startBattleReportRecording(event);
  return undefined;
}
