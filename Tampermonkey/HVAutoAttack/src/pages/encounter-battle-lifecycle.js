import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";
import { recordEncounterStateFailure } from "./encounter-state-failure.js";

const terminalOutcomes = new Set(["defeat", "victory"]);

export const EncounterCompletionStatus = Object.freeze({
  COMPLETED: "completed",
  ALREADY_COMPLETED: "alreadyCompleted",
  NOT_ENCOUNTER_BATTLE: "notEncounterBattle",
  NOT_TERMINAL: "notTerminal",
  PERSISTENCE_FAILED: "persistenceFailed",
});

export function recognizeRandomEncounterStarted(event) {
  if (event.session?.phase !== "active" || event.session?.identity?.roundType !== "ba") {
    return { claimed: false, recognized: false, status: "notEncounterBattle" };
  }
  const persistence = runEncounterStateAutomation({
    type: EncounterStateEvent.MARK_ENTRY_STARTED,
    session: event.session,
    nowMs: event.nowMs,
  });
  if (!persistence?.ok) {
    recordEncounterStateFailure("battle-session-start", {
      reason: "encounterStartPersistenceFailed",
      sessionId: event.session.sessionId,
      persistence,
    });
    return { claimed: false, recognized: true, ok: false, persistence };
  }
  return {
    claimed: false,
    recognized: true,
    ok: true,
    state: persistence.state,
    persistence,
  };
}

export function completeRandomEncounter(event) {
  if (event.session?.identity?.roundType !== "ba") {
    return {
      claimed: false,
      ok: true,
      counted: false,
      status: EncounterCompletionStatus.NOT_ENCOUNTER_BATTLE,
    };
  }
  if (event.session?.phase !== "terminal" || !terminalOutcomes.has(event.session?.outcome)) {
    return {
      claimed: false,
      ok: true,
      counted: false,
      status: EncounterCompletionStatus.NOT_TERMINAL,
    };
  }
  const persistence = runEncounterStateAutomation({
    type: EncounterStateEvent.MARK_COMPLETED,
    session: event.session,
    nowMs: event.nowMs,
  });
  if (persistence?.ok) {
    return {
      claimed: false,
      ok: true,
      counted: persistence.counted,
      status:
        persistence.status === "alreadyCompleted"
          ? EncounterCompletionStatus.ALREADY_COMPLETED
          : EncounterCompletionStatus.COMPLETED,
      state: persistence.state,
      persistence,
    };
  }
  recordEncounterStateFailure("completion", {
    reason: "encounterCompletionPersistenceFailed",
    outcome: event.session?.outcome,
    sessionId: event.session?.sessionId,
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
