export const EncounterLobbyStatus = Object.freeze({
  CLAIMED: "claimed",
  WAITING: "waiting",
  DEGRADED: "degraded",
  STOPPED_FOR_DAY: "stoppedForDay",
});

const TRANSIENT_DEGRADATION_RETRY_MS = 5 * 60 * 1000;

export function readEncounterResumeAt(clock, nowMs = Date.now()) {
  const countdownMs = Number(clock?.countdownMs);
  return Number.isFinite(countdownMs) && countdownMs > 0 ? nowMs + countdownMs : undefined;
}

export function createEncounterLobbyOutcome(status, detail = {}) {
  return Object.freeze({ status, ...detail });
}

export function createEncounterDegradedOutcome(detail = {}, nowMs = Date.now()) {
  return createEncounterLobbyOutcome(EncounterLobbyStatus.DEGRADED, {
    ...detail,
    resumeAtMs:
      detail.resumeAtMs ??
      readEncounterResumeAt(detail.clock, nowMs) ??
      nowMs + TRANSIENT_DEGRADATION_RETRY_MS,
  });
}

export function createEncounterClockOutcome(clock, state, detail, nowMs) {
  const status =
    clock.reason === "stoppedForDay"
      ? EncounterLobbyStatus.STOPPED_FOR_DAY
      : EncounterLobbyStatus.WAITING;
  return createEncounterLobbyOutcome(status, {
    reason: clock.reason,
    state,
    clock,
    resumeAtMs: readEncounterResumeAt(clock, nowMs),
    ...detail,
  });
}

export function createEncounterClaimedOutcome(reason, state, detail = {}) {
  return createEncounterLobbyOutcome(EncounterLobbyStatus.CLAIMED, {
    reason,
    state,
    ...detail,
  });
}

export function createEnteredEncounterOutcome(outcome) {
  if (outcome?.action !== "navigated" || !outcome?.state?.key) return undefined;
  return createEncounterClaimedOutcome("encounterEntered", outcome.state, {
    action: outcome.action,
    href: outcome.href,
    entry: outcome,
  });
}
