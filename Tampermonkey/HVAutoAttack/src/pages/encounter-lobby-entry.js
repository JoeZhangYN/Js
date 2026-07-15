import { executeEncounterEntry } from "./encounter-entry-execution.js";
import { recordEncounterGenerationDegradation } from "./encounter-generation-block.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

export function planStoredEncounterEntry(state) {
  return runEncounterPolicy({
    type: EncounterPolicyEvent.PLAN_ACTIVATION,
    state,
  });
}

export function enterPlannedEncounter(plan) {
  const outcome = executeEncounterEntry(plan);
  return outcome?.handled || outcome?.blocked ? outcome : undefined;
}

export function recordEncounterEntryDegradation(outcome, source) {
  return recordEncounterGenerationDegradation(
    {
      status: "persistenceFailed",
      reason: outcome.reason,
      state: outcome.state,
      persistence: outcome.persistence || outcome.rollback?.persistence,
      blocked: true,
    },
    source
  );
}
