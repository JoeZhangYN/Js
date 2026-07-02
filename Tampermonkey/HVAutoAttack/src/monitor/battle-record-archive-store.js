import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { getValue, setValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { persistBattleRecordArchiveStep } from "./battle-record-archive-failure.js";

const REPORT_RECORD_NAME_FIELD = "__name";

function makeDeps(deps) {
  return {
    delValue: deps.delValue || delValue,
    getValue: deps.getValue || getValue,
    setValue: deps.setValue || setValue,
    readLocalTimestampLabel:
      deps.readLocalTimestampLabel ||
      (() => runTimeAutomation({ type: TimeEvent.LOCAL_TIMESTAMP_LABEL })),
  };
}

function shouldArchive({ recordEach, roundNow, roundAll }) {
  return Boolean(recordEach && roundNow === roundAll);
}

function writePath(record, path, value) {
  const parts = String(path).split(".");
  let target = record;
  for (const part of parts.slice(0, -1)) {
    target[part] = target[part] || {};
    target = target[part];
  }
  target[parts.at(-1)] = value;
}

function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record || {}));
}

function readCurrentBattleReportName(deps) {
  return deps.getValue(STORAGE_KEYS.BATTLE_CODE);
}

function readOrCreateCurrentRecord(event, deps) {
  const current = deps.getValue(event.currentKey, true);
  if (current) return current;
  const record = cloneRecord(event.defaultRecord);
  if (event.startTimeField) writePath(record, event.startTimeField, deps.readLocalTimestampLabel());
  return record;
}

function readCurrentRecord(event, deps) {
  return deps.getValue(event.currentKey, true) || null;
}

function readRecordSet(event, deps) {
  return {
    currentName: readCurrentBattleReportName(deps),
    currentRaw: deps.getValue(event.currentKey, true),
    history: deps.getValue(event.historyKey, true) || [],
  };
}

function startBattleReportRecording(event, deps) {
  if (!event.enabled || readCurrentBattleReportName(deps)) return false;
  return persistBattleRecordArchiveStep("start-recording", STORAGE_KEYS.BATTLE_CODE, () =>
    deps.setValue(STORAGE_KEYS.BATTLE_CODE, event.code)
  );
}

function nameArchivedBattleReportRecord(record, deps) {
  return {
    ...record,
    [REPORT_RECORD_NAME_FIELD]: readCurrentBattleReportName(deps),
  };
}

function storeOrArchiveRecord(event, deps) {
  if (!shouldArchive(event)) {
    if (
      !persistBattleRecordArchiveStep("store-current", event.currentKey, () =>
        deps.setValue(event.currentKey, event.record)
      )
    ) {
      return false;
    }
    return { archived: false };
  }

  const history = deps.getValue(event.historyKey, true) || [];
  const archived = nameArchivedBattleReportRecord(event.record, deps);
  if (event.endTimeField) writePath(archived, event.endTimeField, deps.readLocalTimestampLabel());
  history.push(archived);
  if (
    !persistBattleRecordArchiveStep("archive-history", event.historyKey, () =>
      deps.setValue(event.historyKey, history)
    )
  ) {
    return false;
  }
  if (
    !persistBattleRecordArchiveStep("archive-clear-current", event.currentKey, () =>
      deps.delValue(event.currentKey)
    )
  ) {
    return false;
  }
  return { archived: true, record: archived };
}

function clearRecordSet(event, deps) {
  if (
    !persistBattleRecordArchiveStep("clear-current", event.currentKey, () =>
      deps.delValue(event.currentKey)
    )
  ) {
    return false;
  }
  if (
    !persistBattleRecordArchiveStep("clear-history", event.historyKey, () =>
      deps.delValue(event.historyKey)
    )
  ) {
    return false;
  }
  return true;
}

export function createBattleRecordArchiveStore(deps = {}) {
  const fullDeps = makeDeps(deps);
  return {
    clearRecordSet: (event) => clearRecordSet(event, fullDeps),
    readCurrentRecord: (event) => readCurrentRecord(event, fullDeps),
    readOrCreateCurrentRecord: (event) => readOrCreateCurrentRecord(event, fullDeps),
    readRecordSet: (event) => readRecordSet(event, fullDeps),
    startBattleReportRecording: (event) => startBattleReportRecording(event, fullDeps),
    storeOrArchiveRecord: (event) => storeOrArchiveRecord(event, fullDeps),
  };
}
