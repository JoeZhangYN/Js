import { TimeEvent, runTimeAutomation } from "../core/time.js";
import {
  ENCOUNTER_DAILY_LIMIT,
  EncounterDayPhase,
  normalizeEncounterState,
} from "./encounter-day-state.js";
import {
  buildGenerationAttemptKey,
  readGenerationRecovery,
} from "./encounter-generation-recovery.js";
import { EncounterEntryPhase } from "./encounter-entry-identity.js";

const msUntilNextUtcDay = (stamp) =>
  runTimeAutomation({ type: TimeEvent.MS_UNTIL_NEXT_UTC_DAY, stamp });

export function readEncounterReadiness(state, nowMs = Date.now()) {
  const normalized = normalizeEncounterState(state, nowMs);
  const remainingMs = Math.max(0, normalized.cycleReadyAt - nowMs);
  return {
    state: normalized,
    remainingMs,
    entryPhase: normalized.entry.phase,
    canEnter:
      normalized.entry.phase === EncounterEntryPhase.KEY_AVAILABLE &&
      normalized.dayPhase !== EncounterDayPhase.STOPPED_FOR_DAY,
    dailyLimitReached: normalized.count >= ENCOUNTER_DAILY_LIMIT,
    generationDue:
      remainingMs === 0 &&
      normalized.dayPhase !== EncounterDayPhase.STOPPED_FOR_DAY &&
      [EncounterEntryPhase.IDLE, EncounterEntryPhase.NAVIGATION_ATTEMPTED].includes(
        normalized.entry.phase
      ),
  };
}

function primaryClock(readiness, newDayBoundaryMs) {
  if (readiness.canEnter) return { status: "ready", countdownMs: 0, reason: "keyAvailable" };
  if (readiness.entryPhase === EncounterEntryPhase.BATTLE_ACTIVE) {
    return { status: "active", countdownMs: 0, reason: "battleActive" };
  }
  if (readiness.state.dayPhase === EncounterDayPhase.STOPPED_FOR_DAY) {
    return { status: "countdown", countdownMs: newDayBoundaryMs, reason: "stoppedForDay" };
  }
  if (readiness.remainingMs > 0) {
    if (newDayBoundaryMs < readiness.remainingMs) {
      return { status: "countdown", countdownMs: newDayBoundaryMs, reason: "newDayBoundary" };
    }
    return { status: "countdown", countdownMs: readiness.remainingMs, reason: "cooldown" };
  }
  if (readiness.entryPhase === EncounterEntryPhase.NAVIGATION_ATTEMPTED) {
    return { status: "ready", countdownMs: 0, reason: "attemptedCycleDue" };
  }
  const reason =
    readiness.state.dayPhase === EncounterDayPhase.AWAITING_NEW_DAY
      ? "awaitingNewDay"
      : readiness.state.dayPhase === EncounterDayPhase.CONFIRMING_LIMIT
        ? "limitProbe"
        : "readyWindow";
  return { status: "ready", countdownMs: 0, reason };
}

function withClockIdentities(readiness, primary, recovery, operational, nowMs) {
  return {
    ...readiness,
    ...operational,
    primaryStatus: primary.status,
    primaryCountdownMs: primary.countdownMs,
    primaryReason: primary.reason,
    recoveryStatus: recovery?.status || "idle",
    recoveryCountdownMs: recovery?.countdownMs || 0,
    recoveryReason: recovery?.reason || null,
    attemptKey:
      recovery?.status !== undefined
        ? readiness.state.generationAttemptKey
        : buildGenerationAttemptKey(readiness.state, nowMs),
  };
}

export function readEncounterClock(state, nowMs = Date.now()) {
  const readiness = readEncounterReadiness(state, nowMs);
  const newDayBoundaryMs = msUntilNextUtcDay(nowMs) + 5000;
  const primary = primaryClock(readiness, newDayBoundaryMs);
  const recovery = readGenerationRecovery(readiness.state, nowMs);
  if (
    readiness.canEnter ||
    readiness.entryPhase === EncounterEntryPhase.BATTLE_ACTIVE ||
    primary.reason === "stoppedForDay"
  ) {
    return withClockIdentities(readiness, primary, null, primary, nowMs);
  }
  if (recovery?.status === "responseDue") {
    return withClockIdentities(readiness, primary, recovery, recovery, nowMs);
  }
  if (newDayBoundaryMs < Math.max(primary.countdownMs, recovery?.countdownMs || 0)) {
    const newDay = { status: "countdown", countdownMs: newDayBoundaryMs, reason: "newDayBoundary" };
    return withClockIdentities(readiness, primary, recovery, newDay, nowMs);
  }
  if ((recovery?.countdownMs || 0) > primary.countdownMs) {
    return withClockIdentities(readiness, primary, recovery, recovery, nowMs);
  }
  return withClockIdentities(readiness, primary, recovery, primary, nowMs);
}
