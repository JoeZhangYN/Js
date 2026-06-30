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
    decide: decideSurvivalStep,
  },
  {
    capability: "buffPreparation",
    decide: decideBuffPreparationStep,
  },
  {
    capability: "offensiveDebuff",
    decide: decideOffensiveDebuffStep,
  },
  {
    capability: "attack",
    decide: decideAttackStep,
  },
];

function decideSurvivalStep(actionContext) {
  return runBattleSurvivalAction({
    type: BattleSurvivalActionEvent.DECIDE,
    snap: actionContext.snap,
    opt: actionContext.actionOptions,
  });
}

function decideBuffPreparationStep(actionContext) {
  return runBattleBuffPreparation({
    type: BattleBuffPreparationEvent.DECIDE,
    snap: actionContext.snap,
    opt: actionContext.actionOptions,
  });
}

function decideOffensiveDebuffStep(actionContext) {
  return runBattleOffensiveDebuff({
    type: BattleOffensiveDebuffEvent.DECIDE,
    snap: actionContext.snap,
    opt: actionContext.actionOptions,
  });
}

function decideAttackStep(actionContext) {
  return runBattleAttackAction({
    type: BattleAttackActionEvent.DECIDE,
    snap: actionContext.snap,
    opt: actionContext.actionOptions,
  });
}

function decideActionStep(step, actionContext) {
  return step.decide(actionContext);
}

export function runBattleActionDecision(turnContext = {}) {
  const { snap = {}, actionOptions = {} } = turnContext;
  const actionContext = { snap, actionOptions };
  for (const step of ACTION_STEPS) {
    if (
      runBattleActionEffectDispatch({
        type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
        result: decideActionStep(step, actionContext),
        snap,
      })
    ) {
      return;
    }
  }
}
