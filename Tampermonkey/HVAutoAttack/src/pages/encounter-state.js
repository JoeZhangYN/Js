import { gmXhr } from "../dom/gm-xhr.js";
import {
  EncounterGenerationStateEvent,
  runEncounterGenerationState,
} from "./encounter-generation-state.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { recordEncounterStateFailure } from "./encounter-state-failure.js";
import { EncounterStateStorageEvent, runEncounterStateStorage } from "./encounter-state-storage.js";

const EVENT_READ_CURRENT = "readCurrent";
const EVENT_READ_SNAPSHOT = "readSnapshot";
const EVENT_MARK_ENTRY_STARTED = "markEntryStarted";
const EVENT_MARK_COMPLETED = "markCompleted";
const EVENT_MARK_ATTEMPTED = "markAttempted";
const EVENT_RESTORE_ENTRY = "restoreEntry";
const EVENT_RECORD_GENERATION_RESULT = "recordGenerationResult";
const EVENT_LOAD_KEY = "loadKey";
const EVENT_RESOLVE_GENERATION_CIRCUIT = "resolveGenerationCircuit";

export const EncounterStateEvent = Object.freeze({
  READ_CURRENT: EVENT_READ_CURRENT,
  READ_SNAPSHOT: EVENT_READ_SNAPSHOT,
  MARK_ENTRY_STARTED: EVENT_MARK_ENTRY_STARTED,
  MARK_COMPLETED: EVENT_MARK_COMPLETED,
  MARK_ATTEMPTED: EVENT_MARK_ATTEMPTED,
  RESTORE_ENTRY: EVENT_RESTORE_ENTRY,
  RECORD_GENERATION_RESULT: EVENT_RECORD_GENERATION_RESULT,
  LOAD_KEY: EVENT_LOAD_KEY,
  RESOLVE_GENERATION_CIRCUIT: EVENT_RESOLVE_GENERATION_CIRCUIT,
});

function warnEncounterStateFailure(stage, detail) {
  recordEncounterStateFailure(stage, detail);
}

function storageDeps() {
  return {
    getValue: typeof GM_getValue === "undefined" ? undefined : GM_getValue,
    setValue: typeof GM_setValue === "undefined" ? undefined : GM_setValue,
    localStorage,
    warn: warnEncounterStateFailure,
  };
}

function writeReState(state) {
  return runEncounterStateStorage({ type: EncounterStateStorageEvent.WRITE, state }, storageDeps());
}

function readCurrentSnapshot() {
  const read = runEncounterStateStorage({ type: EncounterStateStorageEvent.READ }, storageDeps());
  if (!read.ok) return read;
  const state = runEncounterPolicy({
    type: EncounterPolicyEvent.NORMALIZE,
    state: read.state,
  });
  const persistence = writeReState(state);
  return persistence.ok
    ? { ...read, state, normalizationPersistence: persistence }
    : {
        ...persistence,
        reason: "normalizationPersistenceFailed",
        state,
        normalizationPersistence: persistence,
      };
}

function readCurrentReState() {
  return readCurrentSnapshot().state;
}

function markRandomEncounterStarted(event = {}) {
  const snapshot = readCurrentSnapshot();
  if (!snapshot.ok) return snapshot;
  const state = runEncounterPolicy({
    type: EncounterPolicyEvent.MARK_ENTRY_STARTED,
    state: snapshot.state,
    session: event.session,
    nowMs: event.nowMs,
  });
  const persistence = writeReState(state);
  return { ok: persistence.ok === true, state, persistence };
}

function markRandomEncounterCompleted(event = {}) {
  const snapshot = readCurrentSnapshot();
  if (!snapshot.ok) return snapshot;
  const settlement = runEncounterPolicy({
    type: EncounterPolicyEvent.MARK_COMPLETED,
    state: snapshot.state,
    session: event.session,
    nowMs: event.nowMs,
  });
  const persistence = writeReState(settlement.state);
  return {
    ok: persistence.ok === true,
    counted: settlement.counted,
    status: settlement.status,
    state: settlement.state,
    persistence,
  };
}

function markEncounterAttempted(key, state) {
  const snapshot = state ? { ok: true, state } : readCurrentSnapshot();
  if (!snapshot.ok) return { ok: false, state: snapshot.state, persistence: snapshot };
  const next = runEncounterPolicy({
    type: EncounterPolicyEvent.MARK_ATTEMPTED,
    state: snapshot.state,
    key,
  });
  const persistence = writeReState(next);
  return { ok: persistence.ok === true, state: next, persistence };
}

function restoreEncounterEntry(state) {
  const persistence = writeReState(state);
  return { ok: persistence.ok === true, state, persistence };
}

function resolveGenerationCircuit(event = {}) {
  const snapshot = readCurrentSnapshot();
  if (!snapshot.ok) return { ok: false, state: snapshot.state, persistence: snapshot };
  const state = runEncounterPolicy({
    type: EncounterPolicyEvent.RESOLVE_GENERATION_CIRCUIT,
    state: snapshot.state,
    nowMs: event.nowMs,
    random: event.random,
  });
  const persistence = writeReState(state);
  return { ok: persistence.ok === true, state, persistence };
}

function runGenerationState(event, type) {
  return runEncounterGenerationState(
    { ...event, type },
    {
      DOMParser,
      gmXhr,
      readState: readCurrentSnapshot,
      writeState: writeReState,
      warn: warnEncounterStateFailure,
    }
  );
}

const encounterStateEventHandlers = Object.freeze({
  [EVENT_READ_CURRENT]: () => readCurrentReState(),
  [EVENT_READ_SNAPSHOT]: () => readCurrentSnapshot(),
  [EVENT_MARK_ENTRY_STARTED]: (event) => markRandomEncounterStarted(event),
  [EVENT_MARK_COMPLETED]: (event) => markRandomEncounterCompleted(event),
  [EVENT_MARK_ATTEMPTED]: (event) => markEncounterAttempted(event.key, event.state),
  [EVENT_RESTORE_ENTRY]: (event) => restoreEncounterEntry(event.state),
  [EVENT_RECORD_GENERATION_RESULT]: (event) =>
    runGenerationState(event, EncounterGenerationStateEvent.RECORD_RESULT),
  [EVENT_LOAD_KEY]: (event) => runGenerationState(event, EncounterGenerationStateEvent.LOAD),
  [EVENT_RESOLVE_GENERATION_CIRCUIT]: resolveGenerationCircuit,
});

export function runEncounterStateAutomation(event = { type: EVENT_READ_CURRENT }) {
  return encounterStateEventHandlers[event?.type]?.(event);
}
