import { AlarmEvent, runAlarmAutomation } from "../alarm/alarm.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

const EVENT_ACTION_STARTED = "actionStarted";
const EVENT_ACTION_ENDED = "actionEnded";
const DELAY_ALERT_OPTION_KEY = "delayAlert";
const DELAY_ALERT_TIME_OPTION_KEY = "delayAlertTime";
const DELAY_RELOAD_OPTION_KEY = "delayReload";
const DELAY_RELOAD_TIME_OPTION_KEY = "delayReloadTime";

const activeDelayTimers = new Set();

export const BattleActionDelayEvent = Object.freeze({
  ACTION_STARTED: EVENT_ACTION_STARTED,
  ACTION_ENDED: EVENT_ACTION_ENDED,
});

function readDelayOptionField(key, fallback) {
  return runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback });
}

function readDelayOption() {
  return {
    delayAlert: Boolean(readDelayOptionField(DELAY_ALERT_OPTION_KEY, false)),
    delayAlertTime: Number(readDelayOptionField(DELAY_ALERT_TIME_OPTION_KEY, 0)) || 0,
    delayReload: Boolean(readDelayOptionField(DELAY_RELOAD_OPTION_KEY, false)),
    delayReloadTime: Number(readDelayOptionField(DELAY_RELOAD_TIME_OPTION_KEY, 0)) || 0,
  };
}

function trackDelayTimer(timer) {
  if (typeof timer !== "undefined" && timer !== null) activeDelayTimers.add(timer);
}

function startActionDelay(deps) {
  endActionDelay(deps);
  const option = readDelayOption();
  if (option.delayAlert) {
    trackDelayTimer(deps.schedule(() => deps.triggerAlarm(), option.delayAlertTime * 1000));
  }
  if (option.delayReload) {
    trackDelayTimer(deps.scheduleReload(option.delayReloadTime));
  }
}

function endActionDelay(deps) {
  for (const timer of activeDelayTimers) deps.cancel(timer);
  activeDelayTimers.clear();
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
