// 战斗行动决策链入口：规则顺序和 acted 短路语义统一收敛在这里。
import { dispatch } from "./dispatch.js";
import { decideAttack } from "./attack/decide-attack.js";
import { attackFacts } from "./attack/attack-facts.js";
import { decideBuffPreparation } from "./buff/decide-buff-preparation.js";
import { buffFacts, channelFacts, infusionFacts } from "./buff/buff-facts.js";
import { decideOffensiveDebuff } from "./debuff/decide-offensive-debuff.js";
import {
  allDebuffFacts,
  bossImperilFacts,
  burstControlFacts,
  singleDebuffFacts,
} from "./debuff/debuff-facts.js";
import { decideSurvivalAction } from "./decide-survival-action.js";

/** @type {import("../core/types.js").BattleRule[]} */
const BATTLE_RULES = [
  {
    name: "handleSurvival",
    decide: (snap, opt) => decideSurvivalAction(snap, opt),
  },
  {
    name: "prepareBuffs",
    decide: (snap, opt) =>
      decideBuffPreparation({
        opt,
        ...infusionFacts(snap),
        ...channelFacts(snap),
        ...buffFacts(snap),
      }),
  },
  {
    name: "applyOffensiveDebuffs",
    decide: (snap, opt) =>
      decideOffensiveDebuff({
        opt,
        ...burstControlFacts(snap),
        ...bossImperilFacts(snap),
        ...allDebuffFacts(snap),
        ...singleDebuffFacts(snap),
      }),
  },
  {
    name: "attack",
    decide: (snap, opt) => decideAttack({ opt, ...attackFacts(snap) }),
  },
];

export function runBattleActionDecision(snap, battleRuleOptions) {
  for (const rule of BATTLE_RULES) {
    if (dispatch(rule.decide(snap, battleRuleOptions), snap)) return;
  }
}
