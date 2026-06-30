import { checkCondition } from "../../settings/condition-eval.js";
import { fleeFacts } from "./flee-facts.js";

const EVENT_DECIDE = "decide";

export const BattleFleeDecisionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleFleeDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: decideFlee,
});

function decideFlee(event = {}) {
  event = fleeDecisionInput(event);
  const opt = event.opt || {};
  if (!opt.autoFlee || !checkCondition(opt.fleeCondition, event.conditionFacts)) {
    return { kind: "noop" };
  }
  return { kind: "flee-command" };
}

function fleeDecisionInput(event) {
  if (!event?.snap) return event;
  return {
    opt: event.opt,
    ...fleeFacts(event.snap),
  };
}

export function runBattleFleeDecision(event = { type: EVENT_DECIDE }) {
  return battleFleeDecisionEventHandlers[event.type]?.(event) ?? { kind: "noop" };
}
