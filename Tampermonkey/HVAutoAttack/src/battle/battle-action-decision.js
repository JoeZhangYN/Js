// 战斗行动决策链入口：规则顺序和 acted 短路语义统一收敛在这里。
import { dispatch } from "./dispatch.js";
import { decideInfusion } from "./buff/decide-infusion.js";
import { decideBuff } from "./buff/decide-buff.js";
import { decideChannel } from "./buff/decide-channel.js";
import { decideDeSkill } from "./debuff/decide-de-skill.js";
import { decideCastDebuffOnAll } from "./debuff/decide-cast-all.js";
import { decideAttack } from "./attack/decide-attack.js";
import { decideGemUse, decidePotion, decideStallTopup, decideScroll } from "./item/decide-item.js";
import { decideCriticalBuff } from "./critical-buff-guard/decide-critical-buff.js";
import { criticalBuffFacts } from "./critical-buff-guard/critical-buff-facts.js";
import { decideDefend } from "./defense/decide-defend.js";
import { defendFacts } from "./defense/defend-facts.js";
import { decideAutoPause } from "./pause/decide-auto-pause.js";
import { autoPauseFacts } from "./pause/auto-pause-facts.js";
import { decideFlee } from "./escape/decide-flee.js";
import { fleeFacts } from "./escape/flee-facts.js";
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
import { gemFacts, potionFacts, scrollFacts, stallTopupFacts } from "./item/item-facts.js";

/** @type {import("../core/types.js").BattleRule[]} */
const BATTLE_RULES = [
  {
    name: "criticalBuffGuard",
    decide: (snap, opt) => decideCriticalBuff({ opt, ...criticalBuffFacts(snap) }),
  },
  {
    name: "flee",
    decide: (snap, opt) => decideFlee({ opt, ...fleeFacts(snap) }),
  },
  {
    name: "autoPause",
    decide: (snap, opt) => decideAutoPause({ opt, ...autoPauseFacts(snap) }),
  },
  { name: "useGem", decide: (snap, opt) => decideGemUse({ opt, ...gemFacts(snap) }) },
  {
    name: "deadSoon",
    decide: (snap, opt) => decidePotion({ opt, ...potionFacts(snap) }),
  },
  {
    name: "stallTopup",
    decide: (snap, opt) => decideStallTopup({ opt, ...stallTopupFacts(snap) }),
  },
  {
    name: "defend",
    decide: (snap, opt) => decideDefend({ opt, ...defendFacts(snap) }),
  },
  {
    name: "useScroll",
    decide: (snap, opt) => decideScroll({ opt, ...scrollFacts(snap) }),
  },
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

export function runBattleActionDecision(snap, battleRuleOptions) {
  for (const rule of BATTLE_RULES) {
    if (dispatch(rule.decide(snap, battleRuleOptions), snap)) return;
  }
}
