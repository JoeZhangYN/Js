import { checkCondition } from "../../settings/condition-eval.js";
import { fleeFacts } from "./flee-facts.js";

export function decideFlee(event = {}) {
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
