import { executeEncounterEntry } from "./encounter-entry-execution.js";
import { showEncounterGenerationBlock } from "./encounter-generation-block.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

export function planStoredEncounterEntry(state, event) {
  return runEncounterPolicy({
    type: EncounterPolicyEvent.PLAN_ACTIVATION,
    state,
    isIsekai: Boolean(event?.isIsekai),
  });
}

export function enterPlannedEncounter(plan) {
  const outcome = executeEncounterEntry(plan);
  return outcome?.handled || outcome?.blocked ? outcome : undefined;
}

export function blockEncounterEntry(outcome, source) {
  return showEncounterGenerationBlock(
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
