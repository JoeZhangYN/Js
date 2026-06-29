import { checkCondition } from "../../settings/condition-eval.js";

export function decideDefend(event = {}) {
  const opt = event.opt || {};
  if (!opt.defend || !checkCondition(opt.defendCondition, event.conditionFacts)) {
    return { kind: "noop" };
  }
  return { kind: "defend-command" };
}
