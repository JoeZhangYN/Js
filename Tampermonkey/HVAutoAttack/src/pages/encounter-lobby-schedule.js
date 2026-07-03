import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { recordEncounterStateFailure } from "./encounter-state-failure.js";

const EVENT_SCHEDULE_NEXT_CHECK = "scheduleNextCheck";
const EVENT_CANCEL_NEXT_CHECK = "cancelNextCheck";

let scheduledLobbyTick = null;

export const EncounterLobbyScheduleEvent = Object.freeze({
  SCHEDULE_NEXT_CHECK: EVENT_SCHEDULE_NEXT_CHECK,
  CANCEL_NEXT_CHECK: EVENT_CANCEL_NEXT_CHECK,
});

function cancelNextCheck() {
  if (scheduledLobbyTick) {
    try {
      clearTimeout(scheduledLobbyTick);
    } catch (error) {
      recordEncounterStateFailure("cancel-lobby-check", { error: error?.message || String(error) });
      return false;
    }
  }
  scheduledLobbyTick = null;
  return true;
}

function scheduleNextCheck(event) {
  if (typeof event.rerun !== "function") return false;
  const plan = runEncounterPolicy({
    type: EncounterPolicyEvent.PLAN_NEXT_CHECK,
    state: event.state,
    nowMs: event.nowMs,
    jitter: event.jitter,
  });
  const delayMs = plan?.delayMs;
  if (!Number.isFinite(delayMs) || delayMs <= 0) return false;
  if (!cancelNextCheck()) return false;
  try {
    scheduledLobbyTick = setTimeout(() => {
      scheduledLobbyTick = null;
      event.rerun();
    }, delayMs);
    return true;
  } catch (error) {
    recordEncounterStateFailure("schedule-lobby-check", {
      delayMs,
      error: error?.message || String(error),
    });
    scheduledLobbyTick = null;
    return false;
  }
}

const encounterLobbyScheduleEventHandlers = Object.freeze({
  [EVENT_SCHEDULE_NEXT_CHECK]: scheduleNextCheck,
  [EVENT_CANCEL_NEXT_CHECK]: cancelNextCheck,
});

export function runEncounterLobbySchedule(event = { type: EVENT_CANCEL_NEXT_CHECK }) {
  return encounterLobbyScheduleEventHandlers[event?.type]?.(event) ?? false;
}
