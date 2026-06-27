import { g } from "../state/store.js";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";

const EVENT_BATTLE_STARTED = "battleStarted";

export const BattleStartRuntimeEvent = Object.freeze({
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
});

function startRuntime(deps) {
  deps.write("attackStatus", deps.readOption().attackStatus);
  deps.startSpeed();
  return true;
}

export function runBattleStartRuntimeAutomation(
  event = { type: EVENT_BATTLE_STARTED },
  deps = {
    readOption: () => g("option") || {},
    write: (key, value) => g(key, value),
    startSpeed: () =>
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.BATTLE_STARTED }),
  }
) {
  if (event.type === EVENT_BATTLE_STARTED) return startRuntime(deps);
  return false;
}
