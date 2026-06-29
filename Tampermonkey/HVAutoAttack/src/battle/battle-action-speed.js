import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { g } from "../state/store.js";

const EVENT_ACTION_ENDED = "actionEnded";
const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_READ_CURRENT = "readCurrent";
const DEFAULT_RUN_SPEED = "0.00";

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
  deps.write("timeNow", timeNow);
  deps.write("runSpeed", runSpeed);
  return { runSpeed };
}

function recordActionEnd(deps) {
  const timeNow = normalizeTimestamp(deps.now());
  const previousTime = normalizeTimestamp(deps.read("timeNow"));
  const elapsedMs = timeNow - previousTime;
  const runSpeed = elapsedMs > 0 ? formatRunSpeed(1000 / elapsedMs) : DEFAULT_RUN_SPEED;
  deps.write("runSpeed", runSpeed);
  deps.write("timeNow", timeNow);
  return { timeNow, runSpeed };
}

function readCurrentSpeed(deps) {
  return formatRunSpeed(deps.read("runSpeed"));
}

export function runBattleActionSpeedAutomation(
  event = { type: EVENT_ACTION_ENDED },
  deps = {
    now: () => runTimeAutomation({ type: TimeEvent.EPOCH_MS }),
    read: (key) => g(key),
    write: (key, value) => g(key, value),
  }
) {
  if (event.type === EVENT_BATTLE_STARTED) return startBattle(deps);
  if (event.type === EVENT_ACTION_ENDED) return recordActionEnd(deps);
  if (event.type === EVENT_READ_CURRENT) return readCurrentSpeed(deps);
  return undefined;
}
