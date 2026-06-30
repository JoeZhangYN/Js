import { decideCriticalBuff } from "./critical-buff-guard/decide-critical-buff.js";
import { criticalBuffFacts } from "./critical-buff-guard/critical-buff-facts.js";
import { decideDefend } from "./defense/decide-defend.js";
import { defendFacts } from "./defense/defend-facts.js";
import { decideAutoPause } from "./pause/decide-auto-pause.js";
import { autoPauseFacts } from "./pause/auto-pause-facts.js";
import { decideFlee } from "./escape/decide-flee.js";
import { fleeFacts } from "./escape/flee-facts.js";
import { BattleItemDecisionEvent, runBattleItemDecision } from "./item/decide-item.js";
import { gemFacts, potionFacts, scrollFacts, stallTopupFacts } from "./item/item-facts.js";

export function survivalActionRules() {
  return [
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
    {
      name: "useGem",
      decide: (snap, opt) =>
        runBattleItemDecision({
          type: BattleItemDecisionEvent.DECIDE_GEM,
          opt,
          ...gemFacts(snap),
        }),
    },
    {
      name: "deadSoon",
      decide: (snap, opt) =>
        runBattleItemDecision({
          type: BattleItemDecisionEvent.DECIDE_POTION,
          opt,
          ...potionFacts(snap),
        }),
    },
    {
      name: "stallTopup",
      decide: (snap, opt) =>
        runBattleItemDecision({
          type: BattleItemDecisionEvent.DECIDE_STALL_TOPUP,
          opt,
          ...stallTopupFacts(snap),
        }),
    },
    {
      name: "defend",
      decide: (snap, opt) => decideDefend({ opt, ...defendFacts(snap) }),
    },
    {
      name: "useScroll",
      decide: (snap, opt) =>
        runBattleItemDecision({
          type: BattleItemDecisionEvent.DECIDE_SCROLL,
          opt,
          ...scrollFacts(snap),
        }),
    },
  ];
}
