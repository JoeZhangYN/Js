import { decideAttack } from "./attack/decide-attack.js";
import { attackFacts } from "./attack/attack-facts.js";

export function finalAttackActionRules() {
  return [
    {
      name: "attack",
      decide: (snap, opt) => decideAttack({ opt, ...attackFacts(snap) }),
    },
  ];
}
