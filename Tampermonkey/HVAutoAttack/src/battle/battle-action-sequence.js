import { decideAttack } from "./attack/decide-attack.js";
import { buffPreparationActionRules } from "./battle-action-buff-sequence.js";
import { offensiveDebuffActionRules } from "./battle-action-debuff-sequence.js";
import { survivalActionRules } from "./battle-action-survival-sequence.js";
import { attackFacts } from "./attack/attack-facts.js";

/** @type {import("../core/types.js").BattleRule[]} */
const BATTLE_RULES = [
  ...survivalActionRules(),
  ...buffPreparationActionRules(),
  ...offensiveDebuffActionRules(),
  {
    name: "attack",
    decide: (snap, opt) => decideAttack({ opt, ...attackFacts(snap) }),
  },
];

export function orderedBattleActionRules() {
  return BATTLE_RULES;
}
