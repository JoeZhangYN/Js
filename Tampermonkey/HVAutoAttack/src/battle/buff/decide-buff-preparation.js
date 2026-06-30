import { decideBuff } from "./decide-buff.js";
import { decideChannel } from "./decide-channel.js";
import { decideInfusion } from "./decide-infusion.js";
import { buffPreparationFacts } from "./buff-facts.js";

const EVENT_DECIDE = "decide";

export const BattleBuffPreparationEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleBuffPreparationEventHandlers = Object.freeze({
  [EVENT_DECIDE]: (event) => decideBuffPreparationResult(event.snap, event.opt),
});

const BUFF_PREPARATION_STEPS = [
  {
    capability: "infusion",
    decide: decideInfusionStep,
  },
  {
    capability: "channel",
    decide: decideChannelStep,
  },
  {
    capability: "buff",
    decide: decideBuffStep,
  },
];

const EMPTY_DECISION_PREDICATES = Object.freeze({
  noop: () => true,
  "channel-plan": isEmptyChannelPlanDecision,
});

const EMPTY_CHANNEL_PLAN_PREDICATES = Object.freeze({
  noop: () => true,
});

function decideInfusionStep(buffPreparationContext) {
  return decideInfusion(buffPreparationContext);
}

function decideChannelStep(buffPreparationContext) {
  return decideChannel(buffPreparationContext);
}

function decideBuffStep(buffPreparationContext) {
  return decideBuff(buffPreparationContext);
}

function decideBuffPreparationResult(snap = {}, opt = {}) {
  const buffPreparationContext = {
    opt,
    ...buffPreparationFacts(snap),
  };
  for (const step of BUFF_PREPARATION_STEPS) {
    const result = step.decide(buffPreparationContext);
    if (!isEmptyDecision(result)) return result;
  }
  return { kind: "noop" };
}

function isEmptyDecision(result) {
  return EMPTY_DECISION_PREDICATES[result?.kind]?.(result) ?? false;
}

function isEmptyChannelPlanDecision(result) {
  return EMPTY_CHANNEL_PLAN_PREDICATES[result.plan?.type]?.(result.plan) ?? false;
}

export function runBattleBuffPreparation(event = { type: EVENT_DECIDE }) {
  return battleBuffPreparationEventHandlers[event.type]?.(event) ?? { kind: "noop" };
}
