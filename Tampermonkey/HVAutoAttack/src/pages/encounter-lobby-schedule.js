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
  const plan = runEncounterPolicy({
    type: EncounterPolicyEvent.PLAN_NEXT_CHECK,
    state: event.state,
    nowMs: event.nowMs,
    jitter: event.jitter,
  });
  const delayMs = plan?.delayMs;
  if (!Number.isFinite(delayMs) || delayMs <= 0) return false;
  cancelNextCheck();
  scheduledLobbyTick = setTimeout(() => {
    scheduledLobbyTick = null;
    event.rerun();
  }, delayMs);
  return true;
}

const encounterLobbyScheduleEventHandlers = Object.freeze({
  [EVENT_SCHEDULE_NEXT_CHECK]: scheduleNextCheck,
  [EVENT_CANCEL_NEXT_CHECK]: () => {
    cancelNextCheck();
    return true;
  },
});

export function runEncounterLobbySchedule(event = { type: EVENT_CANCEL_NEXT_CHECK }) {
  return encounterLobbyScheduleEventHandlers[event?.type]?.(event) ?? false;
}
