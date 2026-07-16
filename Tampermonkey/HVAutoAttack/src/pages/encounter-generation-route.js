import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";

const EVENT_CREATE_REQUEST = "createRequest";

export const EncounterGenerationRouteEvent = Object.freeze({
  CREATE_REQUEST: EVENT_CREATE_REQUEST,
});

function createGenerationRequest() {
  const url = CURRENT_WORLD_POLICY.routes.encounterGenerationUrl;
  if (!CURRENT_WORLD_POLICY.features.randomEncounter || !url) return null;
  return Object.freeze({
    method: "GET",
    url,
    routeIdentity: "persistentEncounterNews",
  });
}

const encounterGenerationRouteHandlers = Object.freeze({
  [EVENT_CREATE_REQUEST]: createGenerationRequest,
});

export function runEncounterGenerationRoute(event = { type: EVENT_CREATE_REQUEST }) {
  return encounterGenerationRouteHandlers[event?.type]?.(event) ?? null;
}
