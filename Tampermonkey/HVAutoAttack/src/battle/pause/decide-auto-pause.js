import { checkCondition } from "../../settings/condition-eval.js";
import { autoPauseFacts } from "./auto-pause-facts.js";

export function decideAutoPause(event = {}) {
  event = autoPauseDecisionInput(event);
  const opt = event.opt || {};
  if (!opt.autoPause || !checkCondition(opt.pauseCondition, event.conditionFacts)) {
    return { kind: "noop" };
  }
  return { kind: "pause" };
}

function autoPauseDecisionInput(event) {
  if (!event?.snap) return event;
  return {
    opt: event.opt,
    ...autoPauseFacts(event.snap),
  };
}
