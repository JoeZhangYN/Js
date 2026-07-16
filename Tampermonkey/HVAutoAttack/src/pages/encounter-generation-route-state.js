import { clearGenerationRecovery } from "./encounter-generation-recovery.js";

export const ENCOUNTER_GENERATION_ROUTE_REVISION = 1;

const retiredRouteAnchors = new Set(["circuitResponse", "encounterFailed"]);

export function migrateEncounterGenerationRouteState(normalized, source = {}) {
  normalized.generationRouteRevision = ENCOUNTER_GENERATION_ROUTE_REVISION;
  if (Number(source.generationRouteRevision) >= ENCOUNTER_GENERATION_ROUTE_REVISION) {
    return normalized;
  }
  if (
    !normalized.clear ||
    (!source.generationFailureReason && !retiredRouteAnchors.has(source.anchorReason))
  ) {
    return normalized;
  }
  clearGenerationRecovery(normalized);
  normalized.date = 0;
  normalized.cycleReadyAt = 0;
  normalized.anchorReason = null;
  normalized.key = "";
  normalized.clear = true;
  return normalized;
}
