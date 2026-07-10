import { showEncounterGenerationBlock } from "./encounter-generation-block.js";
import {
  EncounterGenerationIncidentEvent,
  runEncounterGenerationIncident,
} from "./encounter-generation-incident.js";

export function blockActiveEncounterIncident(clock, state) {
  const incident = runEncounterGenerationIncident({
    type: EncounterGenerationIncidentEvent.READ_ACTIVE,
  });
  if (!incident || incident.attemptKey !== clock.attemptKey) return undefined;
  return showEncounterGenerationBlock(
    {
      status: "persistenceFailed",
      reason: incident.reason,
      result: incident.response,
      request: incident.request,
      recovery: incident.recovery,
      persistence: incident.persistence,
      recoveryEpisode: incident.recoveryEpisode,
      state: { ...state, generationAttemptKey: clock.attemptKey },
      blocked: true,
    },
    incident.sourceIdentity || "lobbyResume"
  );
}
