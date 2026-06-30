import { BattleAttackActionEvent, runBattleAttackAction } from "../attack/decide-attack-action.js";
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
  Object.assign(event, readBigSkillSkipRulings(event));
  for (const decide of [
    decideBurstControl,
    runBossImperilAutomation,
    (input) => decideCastDebuffOnAll({ ...input, debuffKey: "We" }),
    (input) => decideCastDebuffOnAll({ ...input, debuffKey: "Im" }),
    decideDeSkill,
  ]) {
    const result = decide(event);
    if (result.kind !== "noop") return result;
  }
  return { kind: "noop" };
}

export function runBattleOffensiveDebuff(event = { type: EVENT_DECIDE }) {
  if (event.type === EVENT_DECIDE) return decideOffensiveDebuffResult(event.snap, event.opt);
  return { kind: "noop" };
}
