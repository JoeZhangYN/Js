import { decideDeSkill } from "./debuff/decide-de-skill.js";
import { decideCastDebuffOnAll } from "./debuff/decide-cast-all.js";
import { runBossImperilAutomation } from "./debuff/decide-boss-imperil.js";
import { decideBurstControl } from "./debuff/decide-burst-control.js";
import {
  allDebuffFacts,
  bossImperilFacts,
  burstControlFacts,
  singleDebuffFacts,
} from "./debuff/debuff-facts.js";

export function offensiveDebuffActionRules() {
  return [
    {
      name: "burstControl",
      decide: (snap, opt) => decideBurstControl({ opt, ...burstControlFacts(snap) }),
    },
    {
      name: "bossImperil",
      decide: (snap, opt) => runBossImperilAutomation({ opt, ...bossImperilFacts(snap) }),
    },
    {
      name: "castWeakenAll",
      decide: (snap, opt) =>
        decideCastDebuffOnAll({ opt, debuffKey: "We", ...allDebuffFacts(snap) }),
    },
    {
      name: "castImperilAll",
      decide: (snap, opt) =>
        decideCastDebuffOnAll({ opt, debuffKey: "Im", ...allDebuffFacts(snap) }),
    },
    {
      name: "useDeSkill",
      decide: (snap, opt) => decideDeSkill({ opt, ...singleDebuffFacts(snap) }),
    },
  ];
}
