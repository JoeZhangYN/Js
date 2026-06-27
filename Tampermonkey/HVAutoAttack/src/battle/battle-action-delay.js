import { AlarmEvent, runAlarmAutomation } from "../alarm/alarm.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { g } from "../state/store.js";

const EVENT_ACTION_STARTED = "actionStarted";
const EVENT_ACTION_ENDED = "actionEnded";

let delayAlertTimer;
let delayReloadTimer;

export const BattleActionDelayEvent = Object.freeze({
  ACTION_STARTED: EVENT_ACTION_STARTED,
  ACTION_ENDED: EVENT_ACTION_ENDED,
});

function readDelayOption() {
  return g("option") || {};
}

function startActionDelay(deps) {
  endActionDelay(deps);
  const option = readDelayOption();
  if (option.delayAlert) {
    delayAlertTimer = deps.schedule(
      () => deps.triggerAlarm(),
      Number(option.delayAlertTime || 0) * 1000
    );
  }
  if (option.delayReload) {
    delayReloadTimer = deps.scheduleReload(Number(option.delayReloadTime || 0));
  }
}

function endActionDelay(deps) {
  if (delayAlertTimer !== undefined) deps.cancel(delayAlertTimer);
  if (delayReloadTimer !== undefined) deps.cancel(delayReloadTimer);
  delayAlertTimer = undefined;
  delayReloadTimer = undefined;
}

export function runBattleActionDelayAutomation(
  event = { type: EVENT_ACTION_STARTED },
  deps = {
    schedule: setTimeout,
    cancel: clearTimeout,
    triggerAlarm: () => runAlarmAutomation({ type: AlarmEvent.TRIGGER }),
    scheduleReload: (seconds) =>
      runNavigationAutomation({
        type: NavigationEvent.SCHEDULE_RELOAD,
        seconds,
      }),
  }
) {
  if (event.type === EVENT_ACTION_STARTED) {
    startActionDelay(deps);
    return true;
  }
  if (event.type === EVENT_ACTION_ENDED) {
    endActionDelay(deps);
    return true;
  }
  return false;
}
