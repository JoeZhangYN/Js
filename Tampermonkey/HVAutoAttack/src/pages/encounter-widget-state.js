import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

export function readEncounterWidgetState(state) {
  const clock = runEncounterPolicy({ type: EncounterPolicyEvent.READ_CLOCK, state });
  return {
    state: clock.state,
    remainingMs: clock.countdownMs,
    count: clock.state.count,
    status: clock.status,
    reason: clock.reason,
    attemptKey: clock.attemptKey,
    warn: !clock.state.clear,
  };
}
