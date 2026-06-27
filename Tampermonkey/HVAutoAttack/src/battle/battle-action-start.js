import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";

const EVENT_ACTION_STARTED = "actionStarted";

export const BattleActionStartEvent = Object.freeze({
  ACTION_STARTED: EVENT_ACTION_STARTED,
});

function runActionStarted(deps) {
  deps.startDelay();
  deps.monitorActionStarted();
  return true;
}

export function runBattleActionStartAutomation(
  event = { type: EVENT_ACTION_STARTED },
  deps = {
    startDelay: () =>
      runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED }),
    monitorActionStarted: () =>
      runBattleMonitorAutomation({ type: BattleMonitorEvent.ACTION_STARTED }),
  }
) {
  if (event.type === EVENT_ACTION_STARTED) return runActionStarted(deps);
  return false;
}
