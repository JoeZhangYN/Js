import { isAutomaticEncounterEnabled } from "./encounter-option-gate.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";
import { recordEncounterStateFailure } from "./encounter-state-failure.js";

const terminalOutcomes = new Set(["defeat", "victory"]);

export function recognizeRandomEncounterStarted(event) {
  if (!isAutomaticEncounterEnabled()) return { claimed: false, skipped: true };
  return {
    claimed: false,
    recognized: event.source === "battleRoundStart" || Boolean(event.search),
  };
}

export function completeRandomEncounter(event) {
  if (
    !isAutomaticEncounterEnabled() ||
    event.roundType !== "ba" ||
    !terminalOutcomes.has(event.outcome)
  ) {
    return { claimed: false, skipped: true };
  }
  const persistence = runEncounterStateAutomation({
    type: EncounterStateEvent.MARK_COMPLETED,
    nowMs: event.nowMs,
  });
  if (persistence?.ok) {
    return { claimed: false, completed: true, state: persistence.state, persistence };
  }
  recordEncounterStateFailure("completion", {
    reason: "encounterCompletionPersistenceFailed",
    outcome: event.outcome,
    persistence,
  });
  return { claimed: false, completed: false, persistence };
}
