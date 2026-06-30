import { finalAttackActionRules } from "./battle-action-attack-sequence.js";
import { buffPreparationActionRules } from "./battle-action-buff-sequence.js";
import { offensiveDebuffActionRules } from "./battle-action-debuff-sequence.js";
import { survivalActionRules } from "./battle-action-survival-sequence.js";

/** @type {import("../core/types.js").BattleRule[]} */
const BATTLE_RULES = [
  ...survivalActionRules(),
  ...buffPreparationActionRules(),
  ...offensiveDebuffActionRules(),
  ...finalAttackActionRules(),
];

export function orderedBattleActionRules() {
  return BATTLE_RULES;
}
