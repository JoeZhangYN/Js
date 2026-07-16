import { EncounterDayPhase, normalizeEncounterState } from "./encounter-day-state.js";
import { clearGenerationRecovery } from "./encounter-generation-recovery.js";

export function markEncounterKeyAvailable(state, key, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (!key || next.dayPhase === EncounterDayPhase.STOPPED_FOR_DAY) return next;
  if (next.key === key) return next;
  next.key = key;
  next.clear = false;
  return clearGenerationRecovery(next);
}

export function markEncounterAttempted(state, key, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (!key || next.key !== key) return next;
  next.clear = true;
  return next;
}

export function markEncounterEntryStarted(state, event = {}) {
  const nowMs = event.nowMs ?? Date.now();
  const next = normalizeEncounterState(state, nowMs);
  const key = event.key || event.parseKey?.(event.search || "");
  if (key && next.key === key) next.clear = true;
  if (event.source === "battleRoundStart" && next.key) next.clear = true;
  return next;
}
