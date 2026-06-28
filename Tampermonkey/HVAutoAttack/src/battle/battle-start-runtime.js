import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { g } from "../state/store.js";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";

const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_READ_ATTACK_STATUS = "readAttackStatus";

export const BattleStartRuntimeEvent = Object.freeze({
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
  READ_ATTACK_STATUS: EVENT_READ_ATTACK_STATUS,
});

function startRuntime(deps) {
  deps.write("attackStatus", deps.readOptionField("attackStatus"));
  deps.startSpeed();
  return true;
}

function readAttackStatus(deps) {
  return deps.read("attackStatus");
}

export function runBattleStartRuntimeAutomation(
  event = { type: EVENT_BATTLE_STARTED },
  deps = {
    readOptionField: (key, fallback) =>
      runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback }),
    read: (key) => g(key),
    write: (key, value) => g(key, value),
    startSpeed: () =>
      runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.BATTLE_STARTED }),
  }
) {
  if (event.type === EVENT_BATTLE_STARTED) return startRuntime(deps);
  if (event.type === EVENT_READ_ATTACK_STATUS) return readAttackStatus(deps);
  return false;
}
