import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

const EVENT_SCHEDULE_NEXT_CHECK = "scheduleNextCheck";
const EVENT_CANCEL_NEXT_CHECK = "cancelNextCheck";

let scheduledLobbyTick = null;

export const EncounterLobbyScheduleEvent = Object.freeze({
  SCHEDULE_NEXT_CHECK: EVENT_SCHEDULE_NEXT_CHECK,
  CANCEL_NEXT_CHECK: EVENT_CANCEL_NEXT_CHECK,
});

function cancelNextCheck() {
  if (scheduledLobbyTick) clearTimeout(scheduledLobbyTick);
  scheduledLobbyTick = null;
}

function scheduleNextCheck(event) {
  if (typeof event.rerun !== "function") return false;
  const delayMs = runEncounterPolicy({
    type: EncounterPolicyEvent.NEXT_CHECK_DELAY,
    state: event.state,
    nowMs: event.nowMs,
    jitter: event.jitter,
  });
  if (!Number.isFinite(delayMs) || delayMs <= 0) return false;
  cancelNextCheck();
  scheduledLobbyTick = setTimeout(() => {
    scheduledLobbyTick = null;
    event.rerun();
  }, delayMs);
  return true;
}

export function runEncounterLobbySchedule(event = { type: EVENT_CANCEL_NEXT_CHECK }) {
  if (event.type === EVENT_SCHEDULE_NEXT_CHECK) return scheduleNextCheck(event);
  if (event.type === EVENT_CANCEL_NEXT_CHECK) {
    cancelNextCheck();
    return true;
  }
  return false;
}
