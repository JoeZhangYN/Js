// 战斗行动决策链入口：决策上下文、step 顺序和 acted 短路语义统一收敛在这里。
import { BattleAttackActionEvent, runBattleAttackAction } from "./attack/decide-attack-action.js";
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
  {
    capability: "survival",
    type: BattleSurvivalActionEvent.DECIDE,
    decide: runBattleSurvivalAction,
  },
  {
    capability: "buffPreparation",
    type: BattleBuffPreparationEvent.DECIDE,
    decide: runBattleBuffPreparation,
  },
  {
    capability: "offensiveDebuff",
    type: BattleOffensiveDebuffEvent.DECIDE,
    decide: runBattleOffensiveDebuff,
  },
  {
    capability: "attack",
    type: BattleAttackActionEvent.DECIDE,
    decide: runBattleAttackAction,
  },
];

function decideActionStep(step, snap, opt) {
  return step.decide({
    type: step.type,
    snap,
    opt,
  });
}

export function runBattleActionDecision(turnContext = {}) {
  const { snap = {}, actionOptions = {} } = turnContext;
  for (const step of ACTION_STEPS) {
    if (
      runBattleActionEffectDispatch({
        type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
        result: decideActionStep(step, snap, actionOptions),
        snap,
      })
    ) {
      return;
    }
  }
}
