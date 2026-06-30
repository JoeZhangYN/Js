import { BattleAttackFactsEvent, runBattleAttackFacts } from "./attack-facts.js";
import { AttackDecisionEvent, runAttackDecision } from "./decide-attack.js";

const EVENT_DECIDE = "decide";
const EVENT_WILL_CLEAR_WITH_BIG_SKILL = "willClearWithBigSkill";

export const BattleAttackActionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
  WILL_CLEAR_WITH_BIG_SKILL: EVENT_WILL_CLEAR_WITH_BIG_SKILL,
});

const battleAttackActionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: (event) => decideAttackActionResult(event.snap, event.opt),
  [EVENT_WILL_CLEAR_WITH_BIG_SKILL]: (event) => willClearWithBigSkill(event.snap, event.opt),
});

function decideAttackActionResult(snap = {}, opt = {}) {
  return runAttackDecision({
    opt,
    ...runBattleAttackFacts({ type: BattleAttackFactsEvent.READ_ACTION, snap }),
  });
}

function willClearWithBigSkill(snap = {}, opt = {}) {
  return runAttackDecision({
    type: AttackDecisionEvent.WILL_CLEAR_WITH_BIG_SKILL,
    opt,
    ...runBattleAttackFacts({ type: BattleAttackFactsEvent.READ_ACTION, snap }),
  });
}

export function runBattleAttackAction(event = { type: EVENT_DECIDE }) {
  return battleAttackActionEventHandlers[event.type]?.(event) ?? { kind: "noop" };
}
