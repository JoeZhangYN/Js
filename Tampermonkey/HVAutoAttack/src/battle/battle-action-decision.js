// 战斗行动决策链入口：规则顺序和 acted 短路语义统一收敛在这里。
import { dispatch } from "./dispatch.js";
import { decideAttackAction } from "./attack/decide-attack-action.js";
import { decideBuffPreparation } from "./buff/decide-buff-preparation.js";
import { decideOffensiveDebuff } from "./debuff/decide-offensive-debuff.js";
import { decideSurvivalAction } from "./decide-survival-action.js";

/** @type {import("../core/types.js").BattleRule[]} */
const BATTLE_RULES = [
  {
    name: "handleSurvival",
    decide: (snap, opt) => decideSurvivalAction(snap, opt),
  },
  {
    name: "prepareBuffs",
    decide: (snap, opt) => decideBuffPreparation(snap, opt),
  },
  {
    name: "applyOffensiveDebuffs",
    decide: (snap, opt) => decideOffensiveDebuff(snap, opt),
  },
  {
    name: "attack",
    decide: (snap, opt) => decideAttackAction(snap, opt),
  },
];

export function runBattleActionDecision(snap, battleRuleOptions) {
  for (const rule of BATTLE_RULES) {
    if (dispatch(rule.decide(snap, battleRuleOptions), snap)) return;
  }
}
