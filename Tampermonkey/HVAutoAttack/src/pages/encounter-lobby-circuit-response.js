import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";

export function resolveEncounterLobbyCircuitResponse(clock, state, event = {}) {
  if (clock.status !== "responseDue") return { ok: true, clock, state };
  const response = runEncounterStateAutomation({
    type: EncounterStateEvent.RESOLVE_GENERATION_CIRCUIT,
    nowMs: event.nowMs,
    random: event.random,
  });
  if (!response?.ok) {
    return {
      ok: false,
      generation: {
        status: "persistenceFailed",
        reason: "generationCircuitResponsePersistenceFailed",
        state: response?.state,
        persistence: response?.persistence,
        blocked: true,
      },
    };
  }
  return {
    ok: true,
    state: response.state,
    clock: runEncounterPolicy({
      type: EncounterPolicyEvent.READ_CLOCK,
      state: response.state,
      nowMs: event.nowMs,
    }),
  };
}
