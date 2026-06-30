import { decideBurstControl } from "./decide-burst-control.js";
import { runBossImperilAutomation } from "./decide-boss-imperil.js";
import { decideCastDebuffOnAll } from "./decide-cast-all.js";
import { decideDeSkill } from "./decide-de-skill.js";

export function decideOffensiveDebuff(event = {}) {
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
