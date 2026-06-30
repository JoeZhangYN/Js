import { checkCondition } from "../../settings/condition-eval.js";
import { BattleDefendFactsEvent, runBattleDefendFacts } from "./defend-facts.js";

const EVENT_DECIDE = "decide";

export const BattleDefendDecisionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleDefendDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: decideDefend,
});

function decideDefend(event = {}) {
  event = defendDecisionInput(event);
  const opt = event.opt || {};
  if (!opt.defend || !checkCondition(opt.defendCondition, event.conditionFacts)) {
    return { kind: "noop" };
  }
  return { kind: "defend-command" };
}

function defendDecisionInput(event) {
  if (!event?.snap) return event;
  return {
    opt: event.opt,
    ...runBattleDefendFacts({
      type: BattleDefendFactsEvent.READ_DECISION,
      snap: event.snap,
    }),
  };
}

export function runBattleDefendDecision(event = { type: EVENT_DECIDE }) {
  return battleDefendDecisionEventHandlers[event.type]?.(event) ?? { kind: "noop" };
}
