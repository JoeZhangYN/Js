import { checkCondition } from "../../settings/condition-eval.js";

export function decideAutoPause(event = {}) {
  const opt = event.opt || {};
  if (!opt.autoPause || !checkCondition(opt.pauseCondition, event.conditionFacts)) {
    return { kind: "noop" };
  }
  return { kind: "pause" };
}
