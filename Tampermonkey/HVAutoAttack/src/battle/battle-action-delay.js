import { AlarmEvent, runAlarmAutomation } from "../alarm/alarm.js";
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

const EVENT_ACTION_STARTED = "actionStarted";
const EVENT_ACTION_ENDED = "actionEnded";
const DELAY_ALERT_OPTION_KEY = "delayAlert";
const DELAY_ALERT_TIME_OPTION_KEY = "delayAlertTime";
const DELAY_RELOAD_OPTION_KEY = "delayReload";
const DELAY_RELOAD_TIME_OPTION_KEY = "delayReloadTime";
const ACTION_DELAY_EVIDENCE_KEY = DiagnosticEvidenceKey.BATTLE_ACTION_DELAY;
const UNKNOWN_ACTION_DELAY_EVENT = "unknownActionDelayEvent";

const activeDelayTimers = new Set();

export const BattleActionDelayEvent = Object.freeze({
  ACTION_STARTED: EVENT_ACTION_STARTED,
  ACTION_ENDED: EVENT_ACTION_ENDED,
});

const battleActionDelayEventHandlers = Object.freeze({
  [EVENT_ACTION_STARTED]: (event, deps) => handleActionStarted(deps),
  [EVENT_ACTION_ENDED]: (event, deps) => handleActionEnded(deps),
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
  if (option.delayAlert && option.delayAlertTime > 0) {
    trackDelayTimer(deps.schedule(() => deps.triggerAlarm(), option.delayAlertTime * 1000));
  }
  if (option.delayReload && option.delayReloadTime > 0) {
    trackDelayTimer(deps.scheduleReload(option.delayReloadTime, option));
  }
}

function endActionDelay(deps) {
  for (const timer of activeDelayTimers) deps.cancel(timer);
  activeDelayTimers.clear();
}

function handleActionStarted(deps) {
  startActionDelay(deps);
  return true;
}

function handleActionEnded(deps) {
  endActionDelay(deps);
  return true;
}

function recordRejectedActionDelay(event, deps) {
  const evidence = {
    decision: "rejected",
    reason: UNKNOWN_ACTION_DELAY_EVENT,
    eventType: event?.type ?? null,
    at: new Date().toISOString(),
  };
  const storage = deps.sessionStorage ?? window.sessionStorage;
  const debug = deps.debug ?? ((...args) => console.debug(...args));
  try {
    storage.setItem(
      ACTION_DELAY_EVIDENCE_KEY,
      JSON.stringify({ ...evidence, storageWriteOk: true })
    );
    evidence.storageWriteOk = true;
  } catch (error) {
    evidence.storageWriteOk = false;
    evidence.storageWriteError = error?.message || String(error);
    debug("[HVAA] battle action delay", evidence);
    return false;
  }
  debug("[HVAA] battle action delay", evidence);
  return false;
}

export function runBattleActionDelayAutomation(
  event = { type: EVENT_ACTION_STARTED },
  deps = {
    schedule: setTimeout,
    cancel: clearTimeout,
    triggerAlarm: () => runAlarmAutomation({ type: AlarmEvent.TRIGGER }),
    scheduleReload: (seconds, option) =>
      runNavigationAutomation({
        type: NavigationEvent.SCHEDULE_RELOAD,
        reason: NavigationReloadReason.ACTION_WATCHDOG,
        seconds,
        detail: { source: "battleActionDelay", seconds, option },
      }),
    sessionStorage: window.sessionStorage,
    debug: (...args) => console.debug(...args),
  }
) {
  return (
    battleActionDelayEventHandlers[event?.type]?.(event, deps) ??
    recordRejectedActionDelay(event, deps)
  );
}
