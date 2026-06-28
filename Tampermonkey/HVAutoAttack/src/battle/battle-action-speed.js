import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { g } from "../state/store.js";

const EVENT_ACTION_ENDED = "actionEnded";
const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_READ_CURRENT = "readCurrent";

export const BattleActionSpeedEvent = Object.freeze({
  ACTION_ENDED: EVENT_ACTION_ENDED,
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
  READ_CURRENT: EVENT_READ_CURRENT,
});

function startBattle(deps) {
  deps.write("timeNow", deps.now());
  deps.write("runSpeed", 1);
  return { runSpeed: 1 };
}

function recordActionEnd(deps) {
  const timeNow = deps.now();
  const previousTime = Number(deps.read("timeNow"));
  const elapsedMs = timeNow - previousTime;
  const runSpeed = elapsedMs > 0 ? (1000 / elapsedMs).toFixed(2) : "0.00";
  deps.write("runSpeed", runSpeed);
  deps.write("timeNow", timeNow);
  return { timeNow, runSpeed };
}

function readCurrentSpeed(deps) {
  return deps.read("runSpeed");
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
