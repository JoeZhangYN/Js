import { recordEncounterGenerationDegradation } from "./encounter-generation-block.js";
import {
  EncounterGenerationIncidentEvent,
  runEncounterGenerationIncident,
} from "./encounter-generation-incident.js";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { createEncounterDegradedOutcome } from "./encounter-lobby-outcome.js";

const REPLAYABLE_PERSISTENCE_REASONS = new Set([
  "generationStatePersistenceFailed",
  "encounterEntryStatePersistenceFailed",
  "encounterStartPersistenceFailed",
]);

function clearIncident(incident) {
  return runEncounterGenerationIncident({
    type: EncounterGenerationIncidentEvent.CLEAR,
    incident,
  });
}

function replayFailedState(incident, deps) {
  if (!REPLAYABLE_PERSISTENCE_REASONS.has(incident.reason) || !incident.state) return undefined;
  const persistence = deps.persistState?.(incident.state);
  if (!persistence?.ok) return { status: "blocked", persistence };
  return {
    status: "recovered",
    state: persistence.state,
    persistence,
    incidentClear: clearIncident(incident),
  };
}

export function blockActiveEncounterIncident(clock, state, deps = {}) {
  const incident = runEncounterGenerationIncident({
    type: EncounterGenerationIncidentEvent.READ_ACTIVE,
  });
  if (!incident || incident.attemptKey !== clock.attemptKey) return undefined;
  const replay = replayFailedState(incident, deps);
  if (replay?.status === "recovered") return replay;
  const recoveryClock = runEncounterPolicy({
    type: EncounterPolicyEvent.READ_CLOCK,
    state: replay?.persistence?.state || state,
  });
  if (
    !replay &&
    !["generationBackoff", "generationCircuitOpen"].includes(recoveryClock.recoveryReason)
  ) {
    return { status: "cleared", state, incidentClear: clearIncident(incident) };
  }
  const outcome = recordEncounterGenerationDegradation(
    {
      status: "persistenceFailed",
      reason: incident.reason,
      result: incident.response,
      request: incident.request,
      recovery: incident.recovery,
      recoveryEpisode: incident.recoveryEpisode,
      state: { ...state, generationAttemptKey: clock.attemptKey },
      persistence: replay?.persistence || incident.persistence,
      blocked: true,
    },
    incident.sourceIdentity || "lobbyResume"
  );
  return { status: "blocked", state, outcome };
}

export function createActiveEncounterBlockOutcome(activeBlock, clock, nowMs) {
  return createEncounterDegradedOutcome(
    {
      reason: activeBlock.outcome?.evidence?.reason || "encounterIncidentActive",
      state: activeBlock.state,
      clock,
      diagnostic: activeBlock.outcome,
    },
    nowMs
  );
}
