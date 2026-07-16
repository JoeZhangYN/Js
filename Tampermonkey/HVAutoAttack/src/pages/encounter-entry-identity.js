export const EncounterEntryPhase = Object.freeze({
  IDLE: "idle",
  KEY_AVAILABLE: "keyAvailable",
  NAVIGATION_ATTEMPTED: "navigationAttempted",
  BATTLE_ACTIVE: "battleActive",
});

const validPhases = new Set(Object.values(EncounterEntryPhase));

export function idleEncounterEntry() {
  return { phase: EncounterEntryPhase.IDLE, key: "", sessionId: null };
}

export function normalizeEncounterEntry(source = {}) {
  if (source.entry && validPhases.has(source.entry.phase)) {
    const entry = {
      phase: source.entry.phase,
      key: typeof source.entry.key === "string" ? source.entry.key : "",
      sessionId: source.entry.sessionId ? String(source.entry.sessionId) : null,
    };
    if (entry.phase === EncounterEntryPhase.IDLE) return idleEncounterEntry();
    if (entry.phase === EncounterEntryPhase.BATTLE_ACTIVE && !entry.sessionId) {
      return entry.key
        ? { phase: EncounterEntryPhase.NAVIGATION_ATTEMPTED, key: entry.key, sessionId: null }
        : idleEncounterEntry();
    }
    return entry;
  }
  const key = typeof source.key === "string" ? source.key : "";
  if (!key) return idleEncounterEntry();
  return {
    phase:
      source.clear === false
        ? EncounterEntryPhase.KEY_AVAILABLE
        : EncounterEntryPhase.NAVIGATION_ATTEMPTED,
    key,
    sessionId: null,
  };
}

export function encounterEntryWithKey(key) {
  if (!key) return idleEncounterEntry();
  return { phase: EncounterEntryPhase.KEY_AVAILABLE, key, sessionId: null };
}

export function encounterEntryAttempted(entry, key) {
  if (!key || entry?.key !== key) return entry;
  return { phase: EncounterEntryPhase.NAVIGATION_ATTEMPTED, key, sessionId: null };
}

export function encounterEntryActive(entry, session) {
  if (!session?.sessionId || session.identity?.roundType !== "ba") return entry;
  return {
    phase: EncounterEntryPhase.BATTLE_ACTIVE,
    key: entry?.key || "",
    sessionId: session.sessionId,
  };
}
