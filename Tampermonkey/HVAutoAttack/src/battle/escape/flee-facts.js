const EVENT_READ_DECISION = "read-decision";

export const BattleFleeFactsEvent = Object.freeze({
  READ_DECISION: EVENT_READ_DECISION,
});

const battleFleeFactsEventHandlers = Object.freeze({
  [EVENT_READ_DECISION]: (event) => fleeFacts(event.snap),
});

function fleeFacts(snap) {
  return { conditionFacts: snap };
}

export function runBattleFleeFacts(event = { type: EVENT_READ_DECISION }) {
  return battleFleeFactsEventHandlers[event.type]?.(event) ?? {};
}
