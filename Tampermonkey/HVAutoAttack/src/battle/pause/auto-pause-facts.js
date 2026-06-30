const EVENT_READ_DECISION = "read-decision";

export const BattleAutoPauseFactsEvent = Object.freeze({
  READ_DECISION: EVENT_READ_DECISION,
});

const battleAutoPauseFactsEventHandlers = Object.freeze({
  [EVENT_READ_DECISION]: (event) => autoPauseFacts(event.snap),
});

function autoPauseFacts(snap) {
  return { conditionFacts: snap };
}

export function runBattleAutoPauseFacts(event = { type: EVENT_READ_DECISION }) {
  return battleAutoPauseFactsEventHandlers[event.type]?.(event) ?? {};
}
