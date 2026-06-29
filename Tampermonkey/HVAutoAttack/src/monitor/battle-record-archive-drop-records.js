import { STORAGE_KEYS } from "../state/persist-keys.js";
import { createDefaultDropRecord } from "./drop-default-record.js";

export function readOrCreateDropRecord(recordStore) {
  return recordStore.readOrCreateCurrentRecord({
    currentKey: STORAGE_KEYS.DROP,
    defaultRecord: createDefaultDropRecord(),
    startTimeField: "#startTime",
  });
}

export function storeOrArchiveDropRecord(event, recordStore) {
  return recordStore.storeOrArchiveRecord({
    currentKey: STORAGE_KEYS.DROP,
    historyKey: STORAGE_KEYS.DROP_OLD,
    record: event.record,
    endTimeField: "#endTime",
    recordEach: event.recordEach,
    roundNow: event.roundNow,
    roundAll: event.roundAll,
  });
}

export function readDropReportSource(recordStore) {
  return recordStore.readRecordSet({
    currentKey: STORAGE_KEYS.DROP,
    historyKey: STORAGE_KEYS.DROP_OLD,
  });
}

export function clearDropReportRecordSet(recordStore) {
  return recordStore.clearRecordSet({
    currentKey: STORAGE_KEYS.DROP,
    historyKey: STORAGE_KEYS.DROP_OLD,
  });
}
