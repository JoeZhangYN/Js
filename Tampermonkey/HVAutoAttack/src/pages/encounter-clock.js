import { TimeEvent, runTimeAutomation } from "../core/time.js";
import {
  ENCOUNTER_COOLDOWN_MS,
  ENCOUNTER_DAILY_LIMIT,
  EncounterDayPhase,
  normalizeEncounterState,
} from "./encounter-day-state.js";
import {
  buildGenerationAttemptKey,
  readGenerationRecovery,
} from "./encounter-generation-recovery.js";

const msUntilNextUtcDay = (stamp) =>
  runTimeAutomation({ type: TimeEvent.MS_UNTIL_NEXT_UTC_DAY, stamp });

export function readEncounterReadiness(state, nowMs = Date.now()) {
  const normalized = normalizeEncounterState(state, nowMs);
  const remainingMs = normalized.date
    ? Math.max(0, normalized.date + ENCOUNTER_COOLDOWN_MS - nowMs)
    : 0;
  return {
    state: normalized,
    remainingMs,
    canEnter: Boolean(
      normalized.key &&
      !normalized.clear &&
      normalized.dayPhase !== EncounterDayPhase.STOPPED_FOR_DAY
    ),
    dailyLimitReached: normalized.count >= ENCOUNTER_DAILY_LIMIT,
    generationDue: remainingMs === 0 && normalized.dayPhase !== EncounterDayPhase.STOPPED_FOR_DAY,
  };
}

function countdown(readiness, countdownMs, reason, nowMs) {
  return {
    ...readiness,
    status: "countdown",
    countdownMs,
    reason,
    attemptKey: buildGenerationAttemptKey(readiness.state, nowMs, "countdown"),
  };
}

export function readEncounterClock(state, nowMs = Date.now()) {
  const readiness = readEncounterReadiness(state, nowMs);
  const newDayBoundaryMs = msUntilNextUtcDay(nowMs) + 5000;
  if (readiness.canEnter) {
    return {
      ...readiness,
      status: "ready",
      countdownMs: 0,
      reason: "keyAvailable",
      attemptKey: buildGenerationAttemptKey(readiness.state, nowMs, "ready"),
    };
  }
  if (readiness.state.dayPhase === EncounterDayPhase.STOPPED_FOR_DAY) {
    return countdown(readiness, newDayBoundaryMs, "stoppedForDay", nowMs);
  }
  if (readiness.remainingMs > 0) {
    if (newDayBoundaryMs < readiness.remainingMs) {
      return countdown(readiness, newDayBoundaryMs, "newDayBoundary", nowMs);
    }
    return countdown(readiness, readiness.remainingMs, "cooldown", nowMs);
  }
  const recovery = readGenerationRecovery(readiness.state, nowMs);
  if (recovery) {
    return { ...readiness, ...recovery, attemptKey: readiness.state.generationAttemptKey };
  }
  const reason =
    readiness.state.dayPhase === EncounterDayPhase.AWAITING_NEW_DAY
      ? "awaitingNewDay"
      : readiness.state.dayPhase === EncounterDayPhase.CONFIRMING_LIMIT
        ? "limitProbe"
        : "readyWindow";
  const status = readiness.state.clear ? "ready" : "missed";
  return {
    ...readiness,
    status,
    countdownMs: 0,
    reason,
    attemptKey: buildGenerationAttemptKey(readiness.state, nowMs, status),
  };
}
