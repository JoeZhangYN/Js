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

export function decideOffensiveDebuff(snap = {}, opt = {}) {
  const event = {
    opt,
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
