import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { g } from "../state/store.js";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";

const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_READ_ATTACK_STATUS = "readAttackStatus";
const ATTACK_STATUS_RUNTIME_KEY = "attackStatus";
const ATTACK_STATUS_OPTION_KEY = "attackStatus";
const DEFAULT_ATTACK_STATUS = 0;

export const BattleStartRuntimeEvent = Object.freeze({
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
  READ_ATTACK_STATUS: EVENT_READ_ATTACK_STATUS,
});

function normalizeAttackStatus(value) {
  const status = Number(value);
  return Number.isFinite(status) ? status : DEFAULT_ATTACK_STATUS;
}

function startRuntime(deps) {
  deps.write(
    ATTACK_STATUS_RUNTIME_KEY,
    normalizeAttackStatus(deps.readOptionField(ATTACK_STATUS_OPTION_KEY, DEFAULT_ATTACK_STATUS))
  );
  deps.startSpeed();
  return true;
}

function readAttackStatus(deps) {
  return normalizeAttackStatus(deps.read(ATTACK_STATUS_RUNTIME_KEY));
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
  return startRuntimeEventHandlers[event.type]?.(event, deps) ?? false;
}

const startRuntimeEventHandlers = Object.freeze({
  [EVENT_BATTLE_STARTED]: (_event, deps) => startRuntime(deps),
  [EVENT_READ_ATTACK_STATUS]: (_event, deps) => readAttackStatus(deps),
});
