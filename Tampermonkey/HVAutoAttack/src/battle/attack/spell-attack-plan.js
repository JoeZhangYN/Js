import { checkCondition } from "../../settings/condition-eval.js";
import { OFFENSIVE_SPELL_LIB } from "../../data/spell-lib.js";
import { BattleTargetStrategyEvent, runBattleTargetStrategy } from "../battle-target-strategy.js";
import { selectAutoElement } from "./auto-element-selection.js";

export function decideSpellAttackPlan(opt, event, context) {
  const { alive, firstMonster, etherTapGate } = context;
  const autoEl =
    opt.autoElement && firstMonster ? selectAutoElement(firstMonster, opt).element : null;
  const atkStatus = autoEl ?? event.attackStatus;

  if (etherTapGate || atkStatus === 0 || !firstMonster) return null;

  const eventForTier = autoEl ? { ...event, attackStatus: atkStatus } : event;
  const { tier } = selectSpellTier(opt, eventForTier);
  if (tier <= 0) return null;

  const spellId = `1${atkStatus}${tier}`;
  if (!event.skillReady?.[spellId]) return null;

  const spellKey = `${atkStatus}${tier}`;
  const spellName = OFFENSIVE_SPELL_LIB.get(spellKey);
  const aoeCount = spellName
    ? event.spellAoe?.[spellName] || (opt.spellAoe && opt.spellAoe[spellKey]) || 1
    : 1;

  if (aoeCount >= 2 && alive.length > 1) {
    return {
      type: "spell",
      spellId,
      targetId: runBattleTargetStrategy({
        type: BattleTargetStrategyEvent.FIRST_BY_ORDER,
        alive,
      }).id,
    };
  }
  return { type: "spell", spellId, targetId: firstMonster.id };
}

function selectSpellTier(opt, event) {
  const attackStatus = event.attackStatus;
  if (attackStatus === 0 || attackStatus == null) return { tier: 0 };

  const channelLock = opt.channelForceHighTier !== false && event.channeling;
  const downgrade =
    !channelLock &&
    opt.spellTierDowngrade !== false &&
    event.aliveCount <= (opt.spellDowngradeThreshold || 3);

  const id1 = `1${attackStatus}1`;
  const id2 = `1${attackStatus}2`;
  const id3 = `1${attackStatus}3`;
  const ready1 = !!event.skillReady?.[id1];
  const ready2 = !!event.skillReady?.[id2];
  const ready3 = !!event.skillReady?.[id3];

  if (downgrade) return { tier: ready1 ? 1 : 0 };

  const highMet = channelLock || checkCondition(opt.highSkillCondition, event.conditionFacts);
  const midMet = channelLock || checkCondition(opt.middleSkillCondition, event.conditionFacts);
  if (highMet && ready3) return { tier: 3 };
  if (midMet && ready2) return { tier: 2 };
  if (ready1) return { tier: 1 };
  return { tier: 0 };
}
