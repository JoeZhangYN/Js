import { normalizeEncounterState } from "./encounter-day-state.js";
import {
  encounterEntryActive,
  encounterEntryAttempted,
  encounterEntryWithKey,
  EncounterEntryPhase,
} from "./encounter-entry-identity.js";
import { clearGenerationRecovery } from "./encounter-generation-recovery.js";

export function markEncounterKeyAvailable(state, key, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  if (!key || next.dayPhase === "stoppedForDay") return next;
  if (next.entry.phase === EncounterEntryPhase.BATTLE_ACTIVE) return next;
  if (next.entry.phase === EncounterEntryPhase.KEY_AVAILABLE && next.entry.key === key) return next;
  if (next.entry.phase === EncounterEntryPhase.NAVIGATION_ATTEMPTED && next.entry.key === key) {
    return next;
  }
  return clearGenerationRecovery({ ...next, entry: encounterEntryWithKey(key) });
}

export function markEncounterAttempted(state, key, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  return { ...next, entry: encounterEntryAttempted(next.entry, key) };
}

export function markEncounterBattleActive(state, session, nowMs = Date.now()) {
  const next = normalizeEncounterState(state, nowMs);
  return { ...next, entry: encounterEntryActive(next.entry, session) };
}
