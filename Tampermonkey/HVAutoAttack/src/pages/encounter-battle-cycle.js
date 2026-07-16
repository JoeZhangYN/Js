export const ENCOUNTER_DAILY_LIMIT = 24;
export const ENCOUNTER_LIMIT_EMPTY_CYCLES = 3;

export const EncounterDayPhase = Object.freeze({
  AWAITING_NEW_DAY: "awaitingNewDay",
  ACTIVE: "active",
  CONFIRMING_LIMIT: "confirmingLimit",
  STOPPED_FOR_DAY: "stoppedForDay",
});

const validPhases = new Set(Object.values(EncounterDayPhase));
const utcDayKey = (stamp) => new Date(stamp).toISOString().slice(0, 10);

function boundedCount(value, maximum) {
  return Math.min(maximum, Math.max(0, Number(value) || 0));
}

export function isEncounterUtcDayCurrent(utcDay, nowMs = Date.now()) {
  return utcDay === utcDayKey(nowMs);
}

export function defaultEncounterBattleCycle(
  nowMs = Date.now(),
  dayPhase = EncounterDayPhase.ACTIVE
) {
  return {
    count: 0,
    utcDay: utcDayKey(nowMs),
    dayPhase,
    invalidCycleCount: 0,
  };
}

export function normalizeEncounterBattleCycle(source, nowMs = Date.now()) {
  const count = boundedCount(source?.count, ENCOUNTER_DAILY_LIMIT);
  let dayPhase = validPhases.has(source?.dayPhase)
    ? source.dayPhase
    : count >= ENCOUNTER_DAILY_LIMIT
      ? EncounterDayPhase.CONFIRMING_LIMIT
      : EncounterDayPhase.ACTIVE;
  if (count < ENCOUNTER_DAILY_LIMIT && dayPhase !== EncounterDayPhase.AWAITING_NEW_DAY) {
    dayPhase = EncounterDayPhase.ACTIVE;
  }
  if (count >= ENCOUNTER_DAILY_LIMIT && dayPhase === EncounterDayPhase.ACTIVE) {
    dayPhase = EncounterDayPhase.CONFIRMING_LIMIT;
  }
  return {
    count,
    utcDay: utcDayKey(nowMs),
    dayPhase,
    invalidCycleCount:
      dayPhase === EncounterDayPhase.CONFIRMING_LIMIT ||
      dayPhase === EncounterDayPhase.STOPPED_FOR_DAY
        ? boundedCount(source?.invalidCycleCount, ENCOUNTER_LIMIT_EMPTY_CYCLES)
        : 0,
  };
}

export function completeEncounterBattleCycle(cycle) {
  const count = Math.min(ENCOUNTER_DAILY_LIMIT, cycle.count + 1);
  return {
    count,
    utcDay: cycle.utcDay,
    dayPhase:
      count >= ENCOUNTER_DAILY_LIMIT
        ? EncounterDayPhase.CONFIRMING_LIMIT
        : EncounterDayPhase.ACTIVE,
    invalidCycleCount: 0,
  };
}

export function recordPostLimitEmptyCycle(cycle) {
  if (cycle.dayPhase !== EncounterDayPhase.CONFIRMING_LIMIT) return cycle;
  const invalidCycleCount = Math.min(ENCOUNTER_LIMIT_EMPTY_CYCLES, cycle.invalidCycleCount + 1);
  return {
    count: cycle.count,
    utcDay: cycle.utcDay,
    invalidCycleCount,
    dayPhase:
      invalidCycleCount >= ENCOUNTER_LIMIT_EMPTY_CYCLES
        ? EncounterDayPhase.STOPPED_FOR_DAY
        : EncounterDayPhase.CONFIRMING_LIMIT,
  };
}
