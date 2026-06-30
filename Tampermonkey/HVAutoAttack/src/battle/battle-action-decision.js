// 战斗行动决策链入口：规则顺序和 acted 短路语义统一收敛在这里。
import { dispatch } from "./dispatch.js";
import { orderedBattleActionRules } from "./battle-action-sequence.js";

export function runBattleActionDecision(snap, battleRuleOptions) {
  for (const rule of orderedBattleActionRules()) {
    if (dispatch(rule.decide(snap, battleRuleOptions), snap)) return;
  }
}
