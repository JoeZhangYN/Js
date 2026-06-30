// 战斗行动决策链入口：决策上下文、step 顺序和 acted 短路语义统一收敛在这里。
import { decideAttackAction } from "./attack/decide-attack-action.js";
import {
  BattleActionEffectDispatchEvent,
  runBattleActionEffectDispatch,
} from "./battle-action-effect-dispatch.js";
import {
  BattleBuffPreparationEvent,
  runBattleBuffPreparation,
} from "./buff/decide-buff-preparation.js";
import {
  BattleOffensiveDebuffEvent,
  runBattleOffensiveDebuff,
} from "./debuff/decide-offensive-debuff.js";
import { BattleSurvivalActionEvent, runBattleSurvivalAction } from "./decide-survival-action.js";

const ACTION_STEPS = [
  (snap, opt) =>
    runBattleSurvivalAction({
      type: BattleSurvivalActionEvent.DECIDE,
      snap,
      opt,
    }),
  (snap, opt) =>
    runBattleBuffPreparation({
      type: BattleBuffPreparationEvent.DECIDE,
      snap,
      opt,
    }),
  (snap, opt) =>
    runBattleOffensiveDebuff({
      type: BattleOffensiveDebuffEvent.DECIDE,
      snap,
      opt,
    }),
  decideAttackAction,
];

export function runBattleActionDecision(turnContext = {}) {
  const { snap = {}, actionOptions = {} } = turnContext;
  for (const decide of ACTION_STEPS) {
    if (
      runBattleActionEffectDispatch({
        type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
        result: decide(snap, actionOptions),
        snap,
      })
    ) {
      return;
    }
  }
}
