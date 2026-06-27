import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { getValue, setValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";

const EVENT_STORE_OR_ARCHIVE = "storeOrArchive";
const EVENT_READ_CURRENT = "readCurrent";
const EVENT_READ_OR_CREATE_CURRENT = "readOrCreateCurrent";
const EVENT_READ_RECORD_SET = "readRecordSet";
const EVENT_START_RECORDING = "startRecording";
const EVENT_CLEAR_RECORD_SET = "clearRecordSet";

export const BattleRecordArchiveEvent = Object.freeze({
  STORE_OR_ARCHIVE: EVENT_STORE_OR_ARCHIVE,
  READ_CURRENT: EVENT_READ_CURRENT,
  READ_OR_CREATE_CURRENT: EVENT_READ_OR_CREATE_CURRENT,
  READ_RECORD_SET: EVENT_READ_RECORD_SET,
  START_RECORDING: EVENT_START_RECORDING,
  CLEAR_RECORD_SET: EVENT_CLEAR_RECORD_SET,
});

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
    currentName: deps.getValue(STORAGE_KEYS.BATTLE_CODE),
    currentRaw: deps.getValue(event.currentKey, true),
    history: deps.getValue(event.historyKey, true) || [],
  };
}

function startRecording(event, deps) {
  if (!event.enabled || deps.getValue(STORAGE_KEYS.BATTLE_CODE)) return false;
  deps.setValue(STORAGE_KEYS.BATTLE_CODE, event.code);
  return true;
}

function storeOrArchiveRecord(event, deps) {
  if (!shouldArchive(event)) {
    deps.setValue(event.currentKey, event.record);
    return { archived: false };
  }

  const history = deps.getValue(event.historyKey, true) || [];
  const archived = {
    ...event.record,
    __name: deps.getValue(STORAGE_KEYS.BATTLE_CODE),
  };
  if (event.endTimeField) writePath(archived, event.endTimeField, deps.readLocalTimestampLabel());
  history.push(archived);
  deps.setValue(event.historyKey, history);
  deps.delValue(event.currentKey);
  return { archived: true, record: archived };
}

function clearRecordSet(event, deps) {
  deps.delValue(event.currentKey);
  deps.delValue(event.historyKey);
  return true;
}

export function runBattleRecordArchiveAutomation(event, deps = {}) {
  const fullDeps = makeDeps(deps);
  if (event.type === EVENT_READ_CURRENT) return readCurrentRecord(event, fullDeps);
  if (event.type === EVENT_READ_OR_CREATE_CURRENT)
    return readOrCreateCurrentRecord(event, fullDeps);
  if (event.type === EVENT_READ_RECORD_SET) return readRecordSet(event, fullDeps);
  if (event.type === EVENT_START_RECORDING) return startRecording(event, fullDeps);
  if (event.type === EVENT_STORE_OR_ARCHIVE) return storeOrArchiveRecord(event, fullDeps);
  if (event.type === EVENT_CLEAR_RECORD_SET) return clearRecordSet(event, fullDeps);
  return undefined;
}
