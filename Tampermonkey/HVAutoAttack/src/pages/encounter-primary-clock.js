import { migrateEncounterCycle } from "./encounter-state-migration.js";

export const ENCOUNTER_BASE_COOLDOWN_MS = 30 * 60 * 1000;
export const ENCOUNTER_COOLDOWN_MS = ENCOUNTER_BASE_COOLDOWN_MS + 5000;
export const ENCOUNTER_CIRCUIT_JITTER_SECONDS = 30;

export const EncounterAnchorReason = Object.freeze({
  NEW_DAY: "newDay",
  BATTLE_TERMINAL: "encounterCompleted",
  POST_LIMIT_EMPTY: "postLimitEmpty",
  CIRCUIT_RESPONSE: "circuitResponse",
  LEGACY_ENCOUNTER_FAILED: "encounterFailed",
});

const validAnchors = new Set(Object.values(EncounterAnchorReason));

export function defaultEncounterPrimaryClock() {
  return { date: 0, cycleReadyAt: 0, anchorReason: null };
}

export function normalizeEncounterPrimaryClock(source, nowMs = Date.now()) {
  const date = Math.max(0, Number(source?.date) || 0);
  const anchorReason = validAnchors.has(source?.anchorReason)
    ? source.anchorReason
    : date
      ? EncounterAnchorReason.BATTLE_TERMINAL
      : null;
  return migrateEncounterCycle(source, nowMs, ENCOUNTER_COOLDOWN_MS, date, anchorReason);
}

export function anchorEncounterPrimaryClock(
  nowMs,
  anchorReason,
  cooldownMs = ENCOUNTER_COOLDOWN_MS
) {
  return {
    date: nowMs,
    cycleReadyAt: nowMs + cooldownMs,
    anchorReason,
  };
}

export function circuitResponsePrimaryClock(nowMs, random = Math.random) {
  const sample = Math.min(0.999999, Math.max(0, Number(random?.()) || 0));
  const jitterMs = Math.floor(sample * ENCOUNTER_CIRCUIT_JITTER_SECONDS) * 1000;
  return anchorEncounterPrimaryClock(
    nowMs,
    EncounterAnchorReason.CIRCUIT_RESPONSE,
    ENCOUNTER_BASE_COOLDOWN_MS + jitterMs
  );
}
