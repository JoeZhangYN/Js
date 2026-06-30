import { attackFacts } from "./attack-facts.js";
import { decideAttack } from "./decide-attack.js";

const EVENT_DECIDE = "decide";

export const BattleAttackActionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

function decideAttackActionResult(snap = {}, opt = {}) {
  return decideAttack({ opt, ...attackFacts(snap) });
}

export function runBattleAttackAction(event = { type: EVENT_DECIDE }) {
  if (event.type === EVENT_DECIDE) return decideAttackActionResult(event.snap, event.opt);
  return { kind: "noop" };
}
