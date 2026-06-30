import { decideCriticalBuff } from "./critical-buff-guard/decide-critical-buff.js";
import { criticalBuffFacts } from "./critical-buff-guard/critical-buff-facts.js";
import { decideDefend } from "./defense/decide-defend.js";
import { defendFacts } from "./defense/defend-facts.js";
import { decideAutoPause } from "./pause/decide-auto-pause.js";
import { autoPauseFacts } from "./pause/auto-pause-facts.js";
import { decideFlee } from "./escape/decide-flee.js";
import { fleeFacts } from "./escape/flee-facts.js";
import { BattleItemDecisionEvent, runBattleItemDecision } from "./item/decide-item.js";

const EVENT_DECIDE = "decide";

export const BattleSurvivalActionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

function decideSurvivalResult(snap = {}, opt = {}) {
  for (const decide of [
    () => decideCriticalBuff({ opt, ...criticalBuffFacts(snap) }),
    () => decideFlee({ opt, ...fleeFacts(snap) }),
    () => decideAutoPause({ opt, ...autoPauseFacts(snap) }),
    () =>
      runBattleItemDecision({
        type: BattleItemDecisionEvent.DECIDE_GEM,
        opt,
        snap,
      }),
    () =>
      runBattleItemDecision({
        type: BattleItemDecisionEvent.DECIDE_POTION,
        opt,
        snap,
      }),
    () =>
      runBattleItemDecision({
        type: BattleItemDecisionEvent.DECIDE_STALL_TOPUP,
        opt,
        snap,
      }),
    () => decideDefend({ opt, ...defendFacts(snap) }),
    () =>
      runBattleItemDecision({
        type: BattleItemDecisionEvent.DECIDE_SCROLL,
        opt,
        snap,
      }),
  ]) {
    const result = decide();
    if (!isEmptyDecision(result)) return result;
  }
  return { kind: "noop" };
}

function isEmptyDecision(result) {
  if (result.kind === "noop") return true;
  if (result.kind !== "item-plan") return false;
  const plan = result.plan || {};
  if (plan.type === "noop") return true;
  if (plan.type === "potion") return !plan.candidates?.length;
  if (plan.type === "stall") return !plan.attempts?.length;
  if (plan.type === "scroll") return !plan.candidates?.length;
  return false;
}

export function runBattleSurvivalAction(event = { type: EVENT_DECIDE }) {
  if (event.type === EVENT_DECIDE) return decideSurvivalResult(event.snap, event.opt);
  return { kind: "noop" };
}
