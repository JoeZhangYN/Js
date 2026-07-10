const EQUIPMENT_FULL_EVENTPANE_RE =
  /<p[^>]*class=["'][^"']*\bmessagebox_error\b[^"']*["'][^>]*>\s*Your equipment inventory is full\s*<\/p>/i;
const DAWN_EVENTPANE_TEXT = "It is the dawn of a new day";

export const EncounterGenerationResultStatus = Object.freeze({
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  TRANSPORT_FAILURE: "transportFailure",
});

export const EncounterGenerationFailureReason = Object.freeze({
  DAILY_RESET_EVENT: "dailyResetEvent",
  ENCOUNTER_KEY_MISSING: "encounterKeyMissing",
  ENCOUNTER_KEY_ALREADY_ATTEMPTED: "encounterKeyAlreadyAttempted",
  EQUIPMENT_INVENTORY_FULL: "equipmentInventoryFull",
  REQUEST_FAILED: "generationRequestFailed",
  REQUEST_REJECTED: "generationRequestRejected",
  REQUEST_TIMEOUT: "generationRequestTimeout",
});

export const parseEventpaneEncounterKey = (eventpane = "") =>
  eventpane.match(/\?s=Battle&amp;ss=ba&amp;encounter=([A-Za-z0-9=]+)/)?.[1];

export const parseSearchEncounterKey = (search = "") =>
  /\?s=Battle&ss=ba&encounter=([A-Za-z0-9=]+)/.exec(search)?.[1];

export function isBlockingEncounterGenerationResult(result) {
  return [
    EncounterGenerationFailureReason.DAILY_RESET_EVENT,
    EncounterGenerationFailureReason.EQUIPMENT_INVENTORY_FULL,
  ].includes(result?.reason);
}

export function classifyEncounterGenerationResult(event = {}) {
  if (event.transportFailure) {
    return {
      status: EncounterGenerationResultStatus.TRANSPORT_FAILURE,
      reason: event.transportFailure.reason,
      failure: event.transportFailure.detail,
    };
  }
  const eventpane = event.eventpane || "";
  const key =
    event.key || parseEventpaneEncounterKey(eventpane) || parseSearchEncounterKey(event.search);
  if (key) return { status: EncounterGenerationResultStatus.AVAILABLE, key };
  if (eventpane.includes(DAWN_EVENTPANE_TEXT) || event.dawn) {
    return {
      status: EncounterGenerationResultStatus.UNAVAILABLE,
      reason: EncounterGenerationFailureReason.DAILY_RESET_EVENT,
    };
  }
  if (EQUIPMENT_FULL_EVENTPANE_RE.test(eventpane)) {
    return {
      status: EncounterGenerationResultStatus.UNAVAILABLE,
      reason: EncounterGenerationFailureReason.EQUIPMENT_INVENTORY_FULL,
    };
  }
  return {
    status: EncounterGenerationResultStatus.UNAVAILABLE,
    reason: EncounterGenerationFailureReason.ENCOUNTER_KEY_MISSING,
  };
}
