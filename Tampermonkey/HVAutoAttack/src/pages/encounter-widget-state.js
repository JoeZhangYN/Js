import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

export function readEncounterWidgetState(state, event = {}) {
  const clock = runEncounterPolicy({
    type: EncounterPolicyEvent.READ_CLOCK,
    state,
    nowMs: event.nowMs,
  });
  return {
    state: clock.state,
    remainingMs: clock.primaryCountdownMs,
    count: clock.state.count,
    status: clock.primaryStatus,
    reason: clock.primaryReason,
    operationalStatus: clock.status,
    operationalReason: clock.reason,
    recoveryStatus: clock.recoveryStatus,
    recoveryRemainingMs: clock.recoveryCountdownMs,
    recoveryReason: clock.recoveryReason,
    attemptKey: clock.attemptKey,
    warn: !clock.state.clear,
  };
}
