import { decideDeSkill } from "./debuff/decide-de-skill.js";
import { decideCastDebuffOnAll } from "./debuff/decide-cast-all.js";
import { decideAttack } from "./attack/decide-attack.js";
import { buffPreparationActionRules } from "./battle-action-buff-sequence.js";
import { survivalActionRules } from "./battle-action-survival-sequence.js";
import { runBossImperilAutomation } from "./debuff/decide-boss-imperil.js";
import { decideBurstControl } from "./debuff/decide-burst-control.js";
import {
  allDebuffFacts,
  bossImperilFacts,
  burstControlFacts,
  singleDebuffFacts,
} from "./debuff/debuff-facts.js";
import { attackFacts } from "./attack/attack-facts.js";

/** @type {import("../core/types.js").BattleRule[]} */
const BATTLE_RULES = [
  ...survivalActionRules(),
  ...buffPreparationActionRules(),
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
    decide: (snap, opt) => decideCastDebuffOnAll({ opt, debuffKey: "We", ...allDebuffFacts(snap) }),
  },
  {
    name: "castImperilAll",
    decide: (snap, opt) => decideCastDebuffOnAll({ opt, debuffKey: "Im", ...allDebuffFacts(snap) }),
  },
  {
    name: "useDeSkill",
    decide: (snap, opt) => decideDeSkill({ opt, ...singleDebuffFacts(snap) }),
  },
  {
    name: "attack",
    decide: (snap, opt) => decideAttack({ opt, ...attackFacts(snap) }),
  },
];

export function orderedBattleActionRules() {
  return BATTLE_RULES;
}
