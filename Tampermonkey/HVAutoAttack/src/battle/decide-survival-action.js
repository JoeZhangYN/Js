import { decideCriticalBuff } from "./critical-buff-guard/decide-critical-buff.js";
import { criticalBuffFacts } from "./critical-buff-guard/critical-buff-facts.js";
import { decideDefend } from "./defense/decide-defend.js";
import { defendFacts } from "./defense/defend-facts.js";
import { decideAutoPause } from "./pause/decide-auto-pause.js";
import { autoPauseFacts } from "./pause/auto-pause-facts.js";
import { decideFlee } from "./escape/decide-flee.js";
import { fleeFacts } from "./escape/flee-facts.js";
import { BattleItemDecisionEvent, runBattleItemDecision } from "./item/decide-item.js";
import { gemFacts, potionFacts, scrollFacts, stallTopupFacts } from "./item/item-facts.js";

export function decideSurvivalAction(snap = {}, opt = {}) {
  for (const decide of [
    () => decideCriticalBuff({ opt, ...criticalBuffFacts(snap) }),
    () => decideFlee({ opt, ...fleeFacts(snap) }),
    () => decideAutoPause({ opt, ...autoPauseFacts(snap) }),
    () =>
      runBattleItemDecision({
        type: BattleItemDecisionEvent.DECIDE_GEM,
        opt,
        ...gemFacts(snap),
      }),
    () =>
      runBattleItemDecision({
        type: BattleItemDecisionEvent.DECIDE_POTION,
        opt,
        ...potionFacts(snap),
      }),
    () =>
      runBattleItemDecision({
        type: BattleItemDecisionEvent.DECIDE_STALL_TOPUP,
        opt,
        ...stallTopupFacts(snap),
      }),
    () => decideDefend({ opt, ...defendFacts(snap) }),
    () =>
      runBattleItemDecision({
        type: BattleItemDecisionEvent.DECIDE_SCROLL,
        opt,
        ...scrollFacts(snap),
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
