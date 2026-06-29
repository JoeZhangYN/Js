import { checkCondition } from "../../settings/condition-eval.js";

export function decideFlee(event = {}) {
  const opt = event.opt || {};
  if (!opt.autoFlee || !checkCondition(opt.fleeCondition, event.conditionFacts)) {
    return { kind: "noop" };
  }
  return { kind: "flee-command" };
}
