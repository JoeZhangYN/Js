import { BattleAttackActionEvent, runBattleAttackAction } from "../attack/decide-attack-action.js";
import { decideBurstControl } from "./decide-burst-control.js";
import { runBossImperilAutomation } from "./decide-boss-imperil.js";
import { decideCastDebuffOnAll } from "./decide-cast-all.js";
import { decideDeSkill } from "./decide-de-skill.js";
import {
  allDebuffFacts,
  bossImperilFacts,
  burstControlFacts,
  singleDebuffFacts,
} from "./debuff-facts.js";

const EVENT_DECIDE = "decide";

export const BattleOffensiveDebuffEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

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
    ...allDebuffFacts(snap),
    ...singleDebuffFacts(snap),
  };
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
