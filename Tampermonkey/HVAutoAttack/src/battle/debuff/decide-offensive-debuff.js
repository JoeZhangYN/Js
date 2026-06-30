import { BattleAttackActionEvent, runBattleAttackAction } from "../attack/decide-attack-action.js";
import { BattleStallModeEvent, runBattleStallModeAutomation } from "../battle-stall-mode.js";
import { decideBurstControl } from "./decide-burst-control.js";
import { BigSkillDebuffEvent, runBigSkillDebuffAutomation } from "./big-skill-debuff.js";
import { runBossImperilAutomation } from "./decide-boss-imperil.js";
import { decideCastDebuffOnAll } from "./decide-cast-all.js";
import { decideDeSkill } from "./decide-de-skill.js";
import { bossImperilFacts, burstControlFacts, debuffActionFacts } from "./debuff-facts.js";

const EVENT_DECIDE = "decide";

export const BattleOffensiveDebuffEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleOffensiveDebuffEventHandlers = Object.freeze({
  [EVENT_DECIDE]: (event) => decideOffensiveDebuffResult(event.snap, event.opt),
});

const OFFENSIVE_DEBUFF_STEPS = Object.freeze([
  {
    capability: "burstControl",
    decide: decideBurstControlStep,
  },
  {
    capability: "bossImperil",
    decide: decideBossImperilStep,
  },
  {
    capability: "weakenAll",
    decide: decideWeakenAllStep,
  },
  {
    capability: "imperilAll",
    decide: decideImperilAllStep,
  },
  {
    capability: "singleTargetDebuff",
    decide: decideSingleTargetDebuffStep,
  },
]);

const EMPTY_DECISION_PREDICATES = Object.freeze({
  noop: () => true,
});

function readBigSkillSkipRulings(event) {
  const input = {
    type: BigSkillDebuffEvent.SHOULD_SKIP_DEBUFF,
    opt: event.opt,
    skillCooldowns: event.skillCooldowns,
    overcharge: event.overcharge,
    aliveCount: event.aliveCount,
    monsterFacts: event.monsterFacts,
  };
  return {
    skipWeakenForBigSkill: runBigSkillDebuffAutomation({ ...input, kind: "We" }),
    skipImperilForBigSkill: runBigSkillDebuffAutomation({ ...input, kind: "Im" }),
  };
}

function readStallRuling(event) {
  return runBattleStallModeAutomation({
    type: BattleStallModeEvent.READ_ACTIVE,
    opt: event.opt,
    roundNow: event.roundNow,
    roundAll: event.roundAll,
    monsterFacts: event.monsterFacts,
    overcharge: event.overcharge,
  });
}

function decideBurstControlStep(event) {
  return decideBurstControl(event);
}

function decideBossImperilStep(event) {
  return runBossImperilAutomation(event);
}

function decideWeakenAllStep(event) {
  return decideCastDebuffOnAll({ ...event, debuffKey: "We" });
}

function decideImperilAllStep(event) {
  return decideCastDebuffOnAll({ ...event, debuffKey: "Im" });
}

function decideSingleTargetDebuffStep(event) {
  return decideDeSkill(event);
}

function decideOffensiveDebuffResult(snap = {}, opt = {}) {
  const event = {
    opt,
    willClearWithBigSkill: runBattleAttackAction({
      type: BattleAttackActionEvent.WILL_CLEAR_WITH_BIG_SKILL,
      snap,
      opt,
    }),
    ...burstControlFacts(snap),
    ...bossImperilFacts(snap),
    ...debuffActionFacts(snap),
  };
  event.stallActive = readStallRuling(event);
  Object.assign(event, readBigSkillSkipRulings(event));
  for (const step of OFFENSIVE_DEBUFF_STEPS) {
    const result = step.decide(event);
    if (!isEmptyDecision(result)) return result;
  }
  return { kind: "noop" };
}

function isEmptyDecision(result) {
  return EMPTY_DECISION_PREDICATES[result?.kind]?.(result) ?? false;
}

export function runBattleOffensiveDebuff(event = { type: EVENT_DECIDE }) {
  return battleOffensiveDebuffEventHandlers[event.type]?.(event) ?? { kind: "noop" };
}
