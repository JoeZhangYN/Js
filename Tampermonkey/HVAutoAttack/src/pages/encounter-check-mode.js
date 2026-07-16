export const EncounterCheckMode = Object.freeze({
  AUTOMATIC: "automatic",
  MANUAL: "manual",
});

export function isManualEncounterCheck(mode) {
  return mode === EncounterCheckMode.MANUAL;
}

export function normalizeEncounterCheckMode(mode) {
  return isManualEncounterCheck(mode) ? EncounterCheckMode.MANUAL : EncounterCheckMode.AUTOMATIC;
}
