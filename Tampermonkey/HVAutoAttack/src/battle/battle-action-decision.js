// 战斗行动决策链入口：决策上下文、step 顺序和 acted 短路语义统一收敛在这里。
import { BattleAttackActionEvent, runBattleAttackAction } from "./attack/decide-attack-action.js";
import {
  BattleActionEffectDispatchEvent,
  runBattleActionEffectDispatch,
} from "./battle-action-effect-dispatch.js";
import {
  BattleActionDecisionEvidenceEvent,
  runBattleActionDecisionEvidence,
} from "./battle-action-decision-evidence.js";
import {
  BattleBuffPreparationEvent,
  runBattleBuffPreparation,
} from "./buff/decide-buff-preparation.js";
import {
  BattleOffensiveDebuffEvent,
  runBattleOffensiveDebuff,
} from "./debuff/decide-offensive-debuff.js";
import { BattleSurvivalActionEvent, runBattleSurvivalAction } from "./decide-survival-action.js";

const EVENT_DECIDE = "decide";

export const BattleActionDecisionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleActionDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: (event) => decideBattleAction(event.context),
});

const ACTION_STEPS = Object.freeze([
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
]);

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

function decideBattleAction(turnContext = {}) {
  const { snap = {}, actionOptions = {} } = turnContext;
  const actionContext = { snap, actionOptions };
  const steps = [];
  for (const step of ACTION_STEPS) {
    const result = decideActionStep(step, actionContext);
    const acted = runBattleActionEffectDispatch({
      type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
      result,
      snap,
    });
    steps.push({ capability: step.capability, result, acted });
    if (acted) {
      recordDecisionEvidence(steps);
      return;
    }
  }
  recordDecisionEvidence(steps);
}

function recordDecisionEvidence(steps) {
  runBattleActionDecisionEvidence({
    type: BattleActionDecisionEvidenceEvent.RECORD_TRACE,
    steps,
  });
}

export function runBattleActionDecision(event = { type: EVENT_DECIDE }) {
  return battleActionDecisionEventHandlers[event.type]?.(event);
}
