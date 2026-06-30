import { decideOffensiveDebuff } from "./debuff/decide-offensive-debuff.js";
import {
  allDebuffFacts,
  bossImperilFacts,
  burstControlFacts,
  singleDebuffFacts,
} from "./debuff/debuff-facts.js";

export function offensiveDebuffActionRules() {
  return [
    {
      name: "applyOffensiveDebuffs",
      decide: (snap, opt) =>
        decideOffensiveDebuff({
          opt,
          ...burstControlFacts(snap),
          ...bossImperilFacts(snap),
          ...allDebuffFacts(snap),
          ...singleDebuffFacts(snap),
        }),
    },
  ];
}
