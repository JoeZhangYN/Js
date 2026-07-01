import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { g } from "../state/store.js";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

const EVENT_ACTION_ENDED = "actionEnded";
const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_READ_CURRENT = "readCurrent";
const DEFAULT_RUN_SPEED = "0.00";
const ACTION_TIMESTAMP_RUNTIME_KEY = "timeNow";
const ACTION_SPEED_RUNTIME_KEY = "runSpeed";
const ACTION_SPEED_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_ACTION_SPEED;
const UNKNOWN_ACTION_SPEED_EVENT = "unknownActionSpeedEvent";

export const BattleActionSpeedEvent = Object.freeze({
  ACTION_ENDED: EVENT_ACTION_ENDED,
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
  READ_CURRENT: EVENT_READ_CURRENT,
});

function normalizeTimestamp(value) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatRunSpeed(value) {
  const speed = Number(value);
  return Number.isFinite(speed) && speed >= 0 ? speed.toFixed(2) : DEFAULT_RUN_SPEED;
}

function startBattle(deps) {
  const timeNow = normalizeTimestamp(deps.now());
  const runSpeed = formatRunSpeed(1);
  deps.write(ACTION_TIMESTAMP_RUNTIME_KEY, timeNow);
  deps.write(ACTION_SPEED_RUNTIME_KEY, runSpeed);
  return { runSpeed };
}

function recordActionEnd(deps) {
  const timeNow = normalizeTimestamp(deps.now());
  const previousTime = normalizeTimestamp(deps.read(ACTION_TIMESTAMP_RUNTIME_KEY));
  const elapsedMs = timeNow - previousTime;
  const runSpeed = elapsedMs > 0 ? formatRunSpeed(1000 / elapsedMs) : DEFAULT_RUN_SPEED;
  deps.write(ACTION_SPEED_RUNTIME_KEY, runSpeed);
  deps.write(ACTION_TIMESTAMP_RUNTIME_KEY, timeNow);
  return { timeNow, runSpeed };
}

function readCurrentSpeed(deps) {
  return formatRunSpeed(deps.read(ACTION_SPEED_RUNTIME_KEY));
}

function rejectUnknownActionSpeedEvent(event, deps) {
  const evidence = {
    decision: "rejected",
    reason: UNKNOWN_ACTION_SPEED_EVENT,
    eventType: event?.type ?? null,
    at: new Date().toISOString(),
  };
  const storage = deps.sessionStorage ?? window.sessionStorage;
  const debug = deps.debug ?? ((...args) => console.debug(...args));
  try {
    storage.setItem(ACTION_SPEED_EVIDENCE_KEY, JSON.stringify({ ...evidence, storageWriteOk: true }));
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    debug("[HVAA] battle action speed", evidence);
    return false;
  }
  debug("[HVAA] battle action speed", evidence);
  return false;
}

export function runBattleActionSpeedAutomation(
  event = { type: EVENT_ACTION_ENDED },
  deps = {
    now: () => runTimeAutomation({ type: TimeEvent.EPOCH_MS }),
    read: (key) => g(key),
    write: (key, value) => g(key, value),
    sessionStorage: window.sessionStorage,
    debug: (...args) => console.debug(...args),
  }
) {
  return battleActionSpeedEventHandlers[event?.type]?.(event, deps) ?? rejectUnknownActionSpeedEvent(event, deps);
}

const battleActionSpeedEventHandlers = Object.freeze({
  [EVENT_BATTLE_STARTED]: (_event, deps) => startBattle(deps),
  [EVENT_ACTION_ENDED]: (_event, deps) => recordActionEnd(deps),
  [EVENT_READ_CURRENT]: (_event, deps) => readCurrentSpeed(deps),
});
