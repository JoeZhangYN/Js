const EVENT_READ_DECISION = "read-decision";

export const CriticalBuffFactsEvent = Object.freeze({
  READ_DECISION: EVENT_READ_DECISION,
});

const criticalBuffFactsEventHandlers = Object.freeze({
  [EVENT_READ_DECISION]: (event) => criticalBuffFacts(event.snap),
});

function criticalBuffFacts(snap) {
  return {
    manaPercent: snap?.mp,
    playerEffects: snap?.playerEffects,
  };
}

export function runCriticalBuffFacts(event = { type: EVENT_READ_DECISION }) {
  return criticalBuffFactsEventHandlers[event.type]?.(event) ?? {};
}
