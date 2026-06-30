import { attackFacts } from "./attack-facts.js";
import { decideAttack } from "./decide-attack.js";

export function decideAttackAction(snap = {}, opt = {}) {
  return decideAttack({ opt, ...attackFacts(snap) });
}
