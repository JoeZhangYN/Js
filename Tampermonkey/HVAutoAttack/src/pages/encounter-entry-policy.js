import {
  EncounterGenerationRouteEvent,
  runEncounterGenerationRoute,
} from "./encounter-generation-route.js";

const buildEncounterEntryUrl = (key) => `?s=Battle&ss=ba&encounter=${key}`;

export function planEncounterEntryRoute(readiness) {
  if (readiness.canEnter) {
    return {
      action: "enter",
      href: buildEncounterEntryUrl(readiness.state.key),
      state: readiness.state,
    };
  }
  if (readiness.generationDue) {
    const request = runEncounterGenerationRoute({
      type: EncounterGenerationRouteEvent.CREATE_REQUEST,
    });
    if (!request) return { action: "load", state: readiness.state };
    return {
      action: "generate",
      request,
      state: readiness.state,
    };
  }
  return { action: "load", state: readiness.state };
}
