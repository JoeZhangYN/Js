import { checkCondition } from "../../settings/condition-eval.js";
import { autoPauseFacts } from "./auto-pause-facts.js";

const EVENT_DECIDE = "decide";

export const BattleAutoPauseDecisionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleAutoPauseDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: decideAutoPause,
});

function decideAutoPause(event = {}) {
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

export function runBattleAutoPauseDecision(event = { type: EVENT_DECIDE }) {
  return battleAutoPauseDecisionEventHandlers[event.type]?.(event) ?? { kind: "noop" };
}
