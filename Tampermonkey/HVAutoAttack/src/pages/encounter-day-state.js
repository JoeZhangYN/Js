import {
  completeEncounterBattleCycle,
  defaultEncounterBattleCycle,
  EncounterDayPhase,
  isEncounterUtcDayCurrent,
  normalizeEncounterBattleCycle,
  recordPostLimitEmptyCycle,
} from "./encounter-battle-cycle.js";
import {
  carryGenerationRecovery,
  clearGenerationRecovery,
  isGenerationCircuitResponseDue,
} from "./encounter-generation-recovery.js";
import {
  anchorEncounterPrimaryClock,
  circuitResponsePrimaryClock,
  defaultEncounterPrimaryClock,
  EncounterAnchorReason,
  normalizeEncounterPrimaryClock,
} from "./encounter-primary-clock.js";
import { migrateEncounterUtcDay } from "./encounter-state-migration.js";
import {
  ENCOUNTER_GENERATION_ROUTE_REVISION,
  migrateEncounterGenerationRouteState,
} from "./encounter-generation-route-state.js";
import { idleEncounterEntry, normalizeEncounterEntry } from "./encounter-entry-identity.js";

export {
  ENCOUNTER_DAILY_LIMIT,
  ENCOUNTER_LIMIT_EMPTY_CYCLES,
  EncounterDayPhase,
} from "./encounter-battle-cycle.js";
export {
  ENCOUNTER_BASE_COOLDOWN_MS,
  ENCOUNTER_CIRCUIT_JITTER_SECONDS,
  ENCOUNTER_COOLDOWN_MS,
  EncounterAnchorReason,
} from "./encounter-primary-clock.js";

export function defaultEncounterState(nowMs = Date.now()) {
  return {
    ...defaultEncounterPrimaryClock(),
    entry: idleEncounterEntry(),
    lastSettledSessionId: null,
    schemaVersion: 5,
    generationRouteRevision: ENCOUNTER_GENERATION_ROUTE_REVISION,
    ...defaultEncounterBattleCycle(nowMs),
  };
}

export function beginEncounterDay(nowMs = Date.now()) {
  return {
    ...defaultEncounterState(nowMs),
    ...defaultEncounterBattleCycle(nowMs, EncounterDayPhase.AWAITING_NEW_DAY),
  };
}

export function normalizeEncounterState(state, nowMs = Date.now()) {
  const source = state && typeof state === "object" ? state : {};
  const sourceUtcDay = migrateEncounterUtcDay(source, nowMs);
  if (!isEncounterUtcDayCurrent(sourceUtcDay, nowMs)) return beginEncounterDay(nowMs);
  const normalized = {
    ...normalizeEncounterPrimaryClock(source, nowMs),
    entry: normalizeEncounterEntry(source),
    lastSettledSessionId: source.lastSettledSessionId ? String(source.lastSettledSessionId) : null,
    schemaVersion: 5,
    ...normalizeEncounterBattleCycle({ ...source, utcDay: sourceUtcDay }, nowMs),
  };
  return migrateEncounterGenerationRouteState(
    carryGenerationRecovery(normalized, source, nowMs),
    source
  );
}

export function observeEncounterNewDay(state, nowMs = Date.now()) {
  const current = normalizeEncounterState(state, nowMs);
  if (current.anchorReason === EncounterAnchorReason.NEW_DAY) return current;
  if (current.dayPhase !== EncounterDayPhase.AWAITING_NEW_DAY && (current.date || current.count)) {
    return current;
  }
  return {
    ...defaultEncounterState(nowMs),
    ...anchorEncounterPrimaryClock(nowMs, EncounterAnchorReason.NEW_DAY),
  };
}

export function settleEncounterBattle(state, session, nowMs = Date.now()) {
  const current = normalizeEncounterState(state, nowMs);
  if (!session?.sessionId || session.phase !== "terminal" || session.identity?.roundType !== "ba") {
    return { status: "notEncounterBattle", counted: false, state: current };
  }
  if (current.lastSettledSessionId === session.sessionId) {
    return { status: "alreadyCompleted", counted: false, state: current };
  }
  const next = clearGenerationRecovery({
    ...current,
    ...completeEncounterBattleCycle(current),
    ...anchorEncounterPrimaryClock(nowMs, EncounterAnchorReason.BATTLE_TERMINAL),
    entry: idleEncounterEntry(),
    lastSettledSessionId: session.sessionId,
  });
  return { status: "completed", counted: true, state: next };
}

export function markEncounterLimitProbeEmpty(state, nowMs = Date.now()) {
  const current = normalizeEncounterState(state, nowMs);
  const battleCycle = recordPostLimitEmptyCycle(current);
  if (battleCycle === current) return current;
  const next = clearGenerationRecovery({
    ...current,
    ...battleCycle,
    entry: idleEncounterEntry(),
  });
  if (next.dayPhase === EncounterDayPhase.STOPPED_FOR_DAY) return next;
  return {
    ...next,
    ...anchorEncounterPrimaryClock(nowMs, EncounterAnchorReason.POST_LIMIT_EMPTY),
  };
}

export function resolveEncounterGenerationCircuit(state, nowMs = Date.now(), random = Math.random) {
  const current = normalizeEncounterState(state, nowMs);
  if (!isGenerationCircuitResponseDue(current, nowMs)) return current;
  return clearGenerationRecovery({
    ...current,
    ...circuitResponsePrimaryClock(nowMs, random),
  });
}
