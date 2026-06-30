const EVENT_READ_DECISION = "read-decision";

export const BattleDefendFactsEvent = Object.freeze({
  READ_DECISION: EVENT_READ_DECISION,
});

const battleDefendFactsEventHandlers = Object.freeze({
  [EVENT_READ_DECISION]: (event) => defendFacts(event.snap),
});

function defendFacts(snap) {
  return { conditionFacts: snap };
}

export function runBattleDefendFacts(event = { type: EVENT_READ_DECISION }) {
  return battleDefendFactsEventHandlers[event.type]?.(event) ?? {};
}
