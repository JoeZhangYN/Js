// 战斗行动决策链入口：规则顺序和 acted 短路语义统一收敛在这里。
import { dispatch } from "./dispatch.js";
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

export function runBattleActionDecision(snap, battleRuleOptions) {
  for (const rule of BATTLE_RULES) {
    if (dispatch(rule.decide(snap, battleRuleOptions), snap)) return;
  }
}
