import { STORAGE_KEYS } from "../state/persist-keys.js";

function createDefaultUsageStats() {
  return {
    self: {
      _turn: 0,
      _round: 0,
      _battle: 0,
      _monster: 0,
      _boss: 0,
      evade: 0,
      miss: 0,
      focus: 0,
    },
    restore: {},
    items: {},
    magic: {},
    damage: {},
    hurt: {
      mp: 0,
      oc: 0,
      _avg: 0,
      _count: 0,
      _total: 0,
      _mavg: 0,
      _mcount: 0,
      _mtotal: 0,
      _pavg: 0,
      _pcount: 0,
      _ptotal: 0,
    },
    proficiency: {},
  };
}

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

export function readUsageReportRecordSet(recordStore) {
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
