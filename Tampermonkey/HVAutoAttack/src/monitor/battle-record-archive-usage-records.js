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

export function readOrCreateUsageStats(ops, deps) {
  return ops.readOrCreateCurrentRecord(
    {
      currentKey: STORAGE_KEYS.STATS,
      defaultRecord: createDefaultUsageStats(),
      startTimeField: "self._startTime",
    },
    deps
  );
}

export function readUsageStats(ops, deps) {
  return ops.readCurrentRecord({ currentKey: STORAGE_KEYS.STATS }, deps);
}

export function storeUsageStats(event, ops, deps) {
  return ops.storeOrArchiveRecord(
    {
      currentKey: STORAGE_KEYS.STATS,
      historyKey: STORAGE_KEYS.STATS_OLD,
      record: event.record,
      recordEach: false,
    },
    deps
  );
}

export function storeOrArchiveUsageStats(event, ops, deps) {
  return ops.storeOrArchiveRecord(
    {
      currentKey: STORAGE_KEYS.STATS,
      historyKey: STORAGE_KEYS.STATS_OLD,
      record: event.record,
      endTimeField: "self._endTime",
      recordEach: event.recordEach,
      roundNow: event.roundNow,
      roundAll: event.roundAll,
    },
    deps
  );
}

export function readUsageReportRecordSet(ops, deps) {
  return ops.readRecordSet(
    {
      currentKey: STORAGE_KEYS.STATS,
      historyKey: STORAGE_KEYS.STATS_OLD,
    },
    deps
  );
}

export function clearUsageReportRecordSet(ops, deps) {
  return ops.clearRecordSet(
    {
      currentKey: STORAGE_KEYS.STATS,
      historyKey: STORAGE_KEYS.STATS_OLD,
    },
    deps
  );
}
