import { decideInfusion } from "./buff/decide-infusion.js";
import { decideBuff } from "./buff/decide-buff.js";
import { decideChannel } from "./buff/decide-channel.js";
import { decideDeSkill } from "./debuff/decide-de-skill.js";
import { decideCastDebuffOnAll } from "./debuff/decide-cast-all.js";
import { decideAttack } from "./attack/decide-attack.js";
import { survivalActionRules } from "./battle-action-survival-sequence.js";
import { runBossImperilAutomation } from "./debuff/decide-boss-imperil.js";
import { decideBurstControl } from "./debuff/decide-burst-control.js";
import {
  allDebuffFacts,
  bossImperilFacts,
  burstControlFacts,
  singleDebuffFacts,
} from "./debuff/debuff-facts.js";
import { buffFacts, channelFacts, infusionFacts } from "./buff/buff-facts.js";
import { attackFacts } from "./attack/attack-facts.js";

/** @type {import("../core/types.js").BattleRule[]} */
const BATTLE_RULES = [
  ...survivalActionRules(),
  {
    name: "useInfusions",
    decide: (snap, opt) => decideInfusion({ opt, ...infusionFacts(snap) }),
  },
  {
    name: "useChannelSkill",
    decide: (snap, opt) => decideChannel({ opt, ...channelFacts(snap) }),
  },
  {
    name: "useBuffSkill",
    decide: (snap, opt) => decideBuff({ opt, ...buffFacts(snap) }),
  },
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
