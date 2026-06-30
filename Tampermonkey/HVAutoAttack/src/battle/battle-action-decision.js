// 战斗行动决策链入口：规则顺序和 acted 短路语义统一收敛在这里。
import { runRules } from "./step-runner.js";
import { BATTLE_RULES } from "./rules/index.js";

export function runBattleActionDecision(snap, battleRuleOptions) {
  runRules(BATTLE_RULES, snap, battleRuleOptions);
}
