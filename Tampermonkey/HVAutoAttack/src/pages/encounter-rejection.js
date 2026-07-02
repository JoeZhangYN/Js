const REASON_UNKNOWN_EVENT = "unknownEncounterEvent";

export function rejectUnknownEncounterEvent(event) {
  return {
    claimed: false,
    rejected: true,
    reason: REASON_UNKNOWN_EVENT,
    eventType: event?.type ?? null,
  };
}
