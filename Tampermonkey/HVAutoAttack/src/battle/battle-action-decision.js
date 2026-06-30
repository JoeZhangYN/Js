// 战斗行动决策链入口：决策上下文、step 顺序和 acted 短路语义统一收敛在这里。
import { dispatch } from "./dispatch.js";
import { decideAttackAction } from "./attack/decide-attack-action.js";
import { decideBuffPreparation } from "./buff/decide-buff-preparation.js";
import { decideOffensiveDebuff } from "./debuff/decide-offensive-debuff.js";
import { decideSurvivalAction } from "./decide-survival-action.js";

const ACTION_STEPS = [
  decideSurvivalAction,
  decideBuffPreparation,
  decideOffensiveDebuff,
  decideAttackAction,
];

export function runBattleActionDecision(turnContext = {}) {
  const { snap = {}, actionOptions = {} } = turnContext;
  for (const decide of ACTION_STEPS) {
    if (dispatch(decide(snap, actionOptions), snap)) return;
  }
}
