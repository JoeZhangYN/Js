import {
  CriticalBuffDecisionEvent,
  runCriticalBuffDecision,
} from "./critical-buff-guard/decide-critical-buff.js";
import {
  BattleDefendDecisionEvent,
  runBattleDefendDecision,
} from "./defense/decide-defend.js";
import {
  BattleAutoPauseDecisionEvent,
  runBattleAutoPauseDecision,
} from "./pause/decide-auto-pause.js";
import {
  BattleFleeDecisionEvent,
  runBattleFleeDecision,
} from "./escape/decide-flee.js";
import { BattleItemDecisionEvent, runBattleItemDecision } from "./item/decide-item.js";

const EVENT_DECIDE = "decide";

export const BattleSurvivalActionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleSurvivalActionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: (event) => decideSurvivalResult(event.snap, event.opt),
});

const SURVIVAL_ACTION_STEPS = Object.freeze([
  {
    capability: "criticalBuffGuard",
    decide: decideCriticalBuffStep,
  },
  {
    capability: "flee",
    decide: decideFleeStep,
  },
  {
    capability: "autoPause",
    decide: decideAutoPauseStep,
  },
  {
    capability: "gem",
    decide: decideGemStep,
  },
  {
    capability: "potion",
    decide: decidePotionStep,
  },
  {
    capability: "stallTopup",
    decide: decideStallTopupStep,
  },
  {
    capability: "defend",
    decide: decideDefendStep,
  },
  {
    capability: "scroll",
    decide: decideScrollStep,
  },
]);

const EMPTY_DECISION_PREDICATES = Object.freeze({
  noop: () => true,
  "item-plan": isEmptyItemPlanDecision,
});

const EMPTY_ITEM_PLAN_PREDICATES = Object.freeze({
  noop: () => true,
  potion: (plan) => !plan.candidates?.length,
  stall: (plan) => !plan.attempts?.length,
  scroll: (plan) => !plan.candidates?.length,
});

function decideCriticalBuffStep(survivalContext) {
  return runCriticalBuffDecision({
    type: CriticalBuffDecisionEvent.DECIDE,
    ...survivalContext,
  });
}

function decideFleeStep(survivalContext) {
  return runBattleFleeDecision({
    type: BattleFleeDecisionEvent.DECIDE,
    ...survivalContext,
  });
}

function decideAutoPauseStep(survivalContext) {
  return runBattleAutoPauseDecision({
    type: BattleAutoPauseDecisionEvent.DECIDE,
    ...survivalContext,
  });
}

function decideGemStep(survivalContext) {
  return decideItemStep(survivalContext, BattleItemDecisionEvent.DECIDE_GEM);
}

function decidePotionStep(survivalContext) {
  return decideItemStep(survivalContext, BattleItemDecisionEvent.DECIDE_POTION);
}

function decideStallTopupStep(survivalContext) {
  return decideItemStep(survivalContext, BattleItemDecisionEvent.DECIDE_STALL_TOPUP);
}

function decideDefendStep(survivalContext) {
  return runBattleDefendDecision({
    type: BattleDefendDecisionEvent.DECIDE,
    ...survivalContext,
  });
}

function decideScrollStep(survivalContext) {
  return decideItemStep(survivalContext, BattleItemDecisionEvent.DECIDE_SCROLL);
}

function decideItemStep({ opt, snap }, type) {
  return runBattleItemDecision({
    type,
    opt,
    snap,
  });
}

function decideSurvivalResult(snap = {}, opt = {}) {
  const survivalContext = { opt, snap };
  for (const step of SURVIVAL_ACTION_STEPS) {
    const result = step.decide(survivalContext);
    if (!isEmptyDecision(result)) return result;
  }
  return { kind: "noop" };
}

function isEmptyDecision(result) {
  return EMPTY_DECISION_PREDICATES[result?.kind]?.(result) ?? false;
}

function isEmptyItemPlanDecision(result) {
  const plan = result.plan || {};
  return EMPTY_ITEM_PLAN_PREDICATES[plan.type]?.(plan) ?? false;
}

export function runBattleSurvivalAction(event = { type: EVENT_DECIDE }) {
  return battleSurvivalActionEventHandlers[event?.type]?.(event) ?? { kind: "noop" };
}
