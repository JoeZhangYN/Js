import { checkCondition } from "../../settings/condition-eval.js";
import { BattleStallModeEvent, runBattleStallModeAutomation } from "../battle-stall-mode.js";
import { BattleMonsterViewEvent, runBattleMonsterView } from "../battle-monster-view.js";
import { BattleTargetStrategyEvent, runBattleTargetStrategy } from "../battle-target-strategy.js";
import { SpellAttackPlanEvent, runSpellAttackPlan } from "./spell-attack-plan.js";
import { PhysicalSkillScoringEvent, runPhysicalSkillScoring } from "./physical-skill-scoring.js";
import { PhysicalSkillRankingEvent, runPhysicalSkillRanking } from "./physical-skill-ranking.js";

/** merciful blow 斩杀 HP 比例阈值（原 attack.js 字面量 0.248）。 */
const MERCIFUL_HP = 0.248;
const EVENT_DECIDE = "decide";

export const AttackPlanDecisionEvent = Object.freeze({ DECIDE: EVENT_DECIDE });

const attackPlanDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: (event) => decideAttackPlan(event.opt || {}, event),
});

const ATTACK_PLAN_STEPS = Object.freeze([
  { capability: "focus", decide: decideFocusPlan },
  { capability: "spiritToggle", decide: decideSpiritTogglePlan },
  { capability: "spell", decide: decideSpellPlan },
  { capability: "mercifulSingle", decide: decideMercifulSinglePlan },
  { capability: "physicalUtility", decide: decidePhysicalUtilityPlan },
  { capability: "defaultAttack", decide: decideDefaultAttackPlan },
]);

/** @returns {import("../../core/types.js").AttackPlan} */
function decideAttackPlan(opt, event) {
  const context = buildAttackPlanContext(opt, event);
  for (const step of ATTACK_PLAN_STEPS) {
    const plan = step.decide(opt, event, context);
    if (plan) return plan;
  }
  return { type: "noop" };
}

function buildAttackPlanContext(opt, event) {
  const alive = runBattleMonsterView({
    type: BattleMonsterViewEvent.READ_ALIVE_BY_ORDER,
    view: event.monsterFacts,
  });
  const firstMonster = runBattleTargetStrategy({
    type: BattleTargetStrategyEvent.FIRST_BY_FIN_WEIGHT,
    alive,
  }); // finWeight 最小 = 默认攻击目标
  const buffsOf = (id) => (event.monsterFacts || []).find((m) => m.id === id)?.buffs || [];
  const etherTapGate =
    opt.etherTap &&
    !!firstMonster &&
    buffsOf(firstMonster.id).includes("coalescemana") &&
    (!event.etherTapActiveX2 || event.etherTapExpiring) &&
    checkCondition(opt.etherTapCondition, event.conditionFacts);

  return { alive, firstMonster, buffsOf, etherTapGate };
}

function decideFocusPlan(opt, event) {
  if (opt.focus && checkCondition(opt.focusCondition, event.conditionFacts)) {
    return { type: "focus" };
  }
  return null;
}

function decideSpiritTogglePlan(opt, event) {
  const stallNow = runBattleStallModeAutomation({
    type: BattleStallModeEvent.READ_ACTIVE,
    opt,
    roundNow: event?.roundNow,
    roundAll: event?.roundAll,
    monsterFacts: event?.monsterFacts,
    overcharge: event?.overcharge,
  });
  const lastToggle = event.lastSpiritToggleGlobalTurn ?? -999;
  const curGlobalTurn = event.globalTurn || 0;
  const cooldown = opt.spiritToggleMinInterval ?? 3;
  const onCond = opt.turnOnSS && checkCondition(opt.turnOnSSCondition, event.conditionFacts);
  const offCond = opt.turnOffSS && checkCondition(opt.turnOffSSCondition, event.conditionFacts);
  const wantsOn = onCond && !event.spiritOn;
  const wantsOff = offCond && event.spiritOn;
  const bothActive = onCond && offCond;

  if (!stallNow && !bothActive && curGlobalTurn - lastToggle >= cooldown && (wantsOn || wantsOff)) {
    return { type: "toggle-spirit" };
  }
  return null;
}

function decideSpellPlan(opt, event, context) {
  return runSpellAttackPlan({ type: SpellAttackPlanEvent.DECIDE, opt, event, context });
}

function decideMercifulSinglePlan(opt, event, context) {
  const { alive, firstMonster, buffsOf } = context;
  if (
    !opt.skillSwitch ||
    !firstMonster ||
    !opt.mercifulBlow ||
    opt.fightingStyle !== "2" ||
    alive.length !== 1 ||
    event.roundNow !== event.roundAll
  ) {
    return null;
  }

  const skillId = `2${opt.fightingStyle}03`;
  if (
    firstMonster.hpAbsNow / firstMonster.hpMax < MERCIFUL_HP &&
    buffsOf(firstMonster.id).includes("wpn_bleed") &&
    event.overcharge >= 105 &&
    event.skillReady?.[skillId]
  ) {
    return { type: "merciful-single", skillId, targetId: firstMonster.id };
  }
  return null;
}

function decidePhysicalUtilityPlan(opt, event, context) {
  const { alive, firstMonster, buffsOf } = context;
  if (!opt.skillSwitch || !firstMonster) return null;

  const firstStunned = opt.fightingStyle === "2" && buffsOf(firstMonster.id).includes("wpn_stun");
  const scored = runPhysicalSkillScoring({
    type: PhysicalSkillScoringEvent.SCORE_CANDIDATES,
    opt,
    event,
    ctx: { firstMonsterStunned: !!firstStunned },
  });
  const winner = runPhysicalSkillRanking({
    type: PhysicalSkillRankingEvent.PICK_BY_UTILITY,
    candidates: scored,
    options: { debugLog: !!opt.dynamicHealLog },
  });
  if (!winner) return null;

  const mercifulTargetId = decideMercifulAoeTarget(opt, alive, winner, buffsOf);
  return {
    type: "physical",
    skillId: winner.id,
    code: winner.code,
    defaultTargetId: firstMonster.id,
    mercifulTargetId,
  };
}

function decideMercifulAoeTarget(opt, alive, winner, buffsOf) {
  if (
    !opt.mercifulBlow ||
    opt.fightingStyle !== "2" ||
    winner.code !== "T3" ||
    alive.length <= 1
  ) {
    return null;
  }
  const target = alive.find(
    (x) => x.hpAbsNow / x.hpMax < MERCIFUL_HP && buffsOf(x.id).includes("wpn_bleed")
  );
  return target ? target.id : null;
}

function decideDefaultAttackPlan(_opt, _event, context) {
  if (context.firstMonster) return { type: "default", targetId: context.firstMonster.id };
  return { type: "noop" };
}

export function runAttackPlanDecision(event = { type: EVENT_DECIDE }) {
  return attackPlanDecisionEventHandlers[event.type]?.(event) ?? { type: "noop" };
}
