import { createDefaultDropRecord } from "./drop-default-record.js";
import { BattleReportCheckpointMode } from "./battle-record-archive-store.js";
import { BattleReportFamily } from "./battle-report-history.js";

function readOrCreateDropRecord(recordStore) {
  return recordStore.readOrCreateCurrentRecord({
    family: BattleReportFamily.DROP,
    defaultRecord: createDefaultDropRecord(),
    startTimeField: "#startTime",
  });
}

function storeOrArchiveDropRecord(event, recordStore) {
  return recordStore.storeOrArchiveRecord({
    family: BattleReportFamily.DROP,
    record: event.record,
    endTimeField: "#endTime",
    recordEach: event.recordEach,
    roundNow: event.roundNow,
    roundAll: event.roundAll,
    checkpointMode: BattleReportCheckpointMode.ROUND_BOUNDARY,
  });
}

function readDropReportSource(recordStore) {
  return recordStore.readRecordSet({
    family: BattleReportFamily.DROP,
  });
}

function clearDropReportRecordSet(recordStore) {
  return recordStore.clearRecordSet({
    family: BattleReportFamily.DROP,
  });
}

export const dropRecordArchiveFamily = Object.freeze({
  clearDropReportRecordSet,
  readDropReportSource,
  readOrCreateDropRecord,
  storeOrArchiveDropRecord,
});
