import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

export function readEncounterWidgetState(state, event = {}) {
  const readClock = (current) =>
    runEncounterPolicy({
      type: EncounterPolicyEvent.READ_CLOCK,
      state: current,
      nowMs: event.nowMs,
    });
  let clock = readClock(state);
  if (clock.status === "responseDue") {
    const resolved = runEncounterPolicy({
      type: EncounterPolicyEvent.RESOLVE_GENERATION_CIRCUIT,
      state: clock.state,
      nowMs: event.nowMs,
      random: event.random,
    });
    clock = readClock(resolved);
  }
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
