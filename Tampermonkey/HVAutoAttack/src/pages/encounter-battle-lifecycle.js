import { isAutomaticEncounterEnabled } from "./encounter-option-gate.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";
import { recordEncounterStateFailure } from "./encounter-state-failure.js";

const terminalOutcomes = new Set(["defeat", "victory"]);

export const EncounterCompletionStatus = Object.freeze({
  COMPLETED: "completed",
  NOT_ENCOUNTER_BATTLE: "notEncounterBattle",
  NOT_TERMINAL: "notTerminal",
  PERSISTENCE_FAILED: "persistenceFailed",
});

export function recognizeRandomEncounterStarted(event) {
  if (!isAutomaticEncounterEnabled()) return { claimed: false, skipped: true };
  return {
    claimed: false,
    recognized: event.source === "battleRoundStart" || Boolean(event.search),
  };
}

export function completeRandomEncounter(event) {
  if (event.roundType !== "ba") {
    return {
      claimed: false,
      ok: true,
      counted: false,
      status: EncounterCompletionStatus.NOT_ENCOUNTER_BATTLE,
    };
  }
  if (!terminalOutcomes.has(event.outcome)) {
    return {
      claimed: false,
      ok: true,
      counted: false,
      status: EncounterCompletionStatus.NOT_TERMINAL,
    };
  }
  const persistence = runEncounterStateAutomation({
    type: EncounterStateEvent.MARK_COMPLETED,
    nowMs: event.nowMs,
  });
  if (persistence?.ok) {
    return {
      claimed: false,
      ok: true,
      counted: true,
      status: EncounterCompletionStatus.COMPLETED,
      state: persistence.state,
      persistence,
    };
  }
  recordEncounterStateFailure("completion", {
    reason: "encounterCompletionPersistenceFailed",
    outcome: event.outcome,
    persistence,
  });
  return {
    claimed: false,
    ok: false,
    counted: false,
    status: EncounterCompletionStatus.PERSISTENCE_FAILED,
    persistence,
  };
}
