import { checkCondition } from "../../settings/condition-eval.js";
import { defendFacts } from "./defend-facts.js";

export function decideDefend(event = {}) {
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
    ...defendFacts(event.snap),
  };
}
