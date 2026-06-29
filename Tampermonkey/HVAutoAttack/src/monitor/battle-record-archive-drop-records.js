import { STORAGE_KEYS } from "../state/persist-keys.js";

export function readOrCreateDropRecord(ops, deps) {
  return ops.readOrCreateCurrentRecord(
    {
      currentKey: STORAGE_KEYS.DROP,
      defaultRecord: { "#EXP": 0, "#Credit": 0 },
      startTimeField: "#startTime",
    },
    deps
  );
}

export function storeOrArchiveDropRecord(event, ops, deps) {
  return ops.storeOrArchiveRecord(
    {
      currentKey: STORAGE_KEYS.DROP,
      historyKey: STORAGE_KEYS.DROP_OLD,
      record: event.record,
      endTimeField: "#endTime",
      recordEach: event.recordEach,
      roundNow: event.roundNow,
      roundAll: event.roundAll,
    },
    deps
  );
}

export function readDropReportRecordSet(ops, deps) {
  return ops.readRecordSet(
    {
      currentKey: STORAGE_KEYS.DROP,
      historyKey: STORAGE_KEYS.DROP_OLD,
    },
    deps
  );
}

export function clearDropReportRecordSet(ops, deps) {
  return ops.clearRecordSet(
    {
      currentKey: STORAGE_KEYS.DROP,
      historyKey: STORAGE_KEYS.DROP_OLD,
    },
    deps
  );
}
