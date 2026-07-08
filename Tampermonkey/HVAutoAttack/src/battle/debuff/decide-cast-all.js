// PURE 决策：基于 snapshot 决定 castDebuffOnAll 的 ActionResult。
// 不读 DOM / 不调 g() / 不写 setValue。
// Phase 5b-2 wave 1 第 2 个 L1 切缝示例。
import { DEBUFF_SKILL_LIB } from "../../data/debuff-lib.js";
import { checkCondition } from "../../settings/condition-eval.js";
import {
  BattleDebuffCoverageEvent,
  runBattleDebuffCoverageAutomation,
} from "../battle-debuff-coverage.js";
import { BattleMonsterViewEvent, runBattleMonsterView } from "../battle-monster-view.js";
import { BattleTargetStrategyEvent, runBattleTargetStrategy } from "../battle-target-strategy.js";
import { BattleDebuffApplicabilityEvent, runBattleDebuffApplicability } from "./can-apply.js";

const ALL_DEBUFF_GATES = Object.freeze({
  We: Object.freeze({
    enabledKey: "debuffSkillAllWk",
    conditionKey: "debuffSkillWkCondition",
    coverageName: "weaken",
    skipInStall: false,
  }),
  Im: Object.freeze({
    enabledKey: "debuffSkillAllIm",
    conditionKey: "debuffSkillImpCondition",
    coverageName: "imperil",
    skipInStall: true,
  }),
});

const EVENT_DECIDE = "decide";

export const BattleAllDebuffDecisionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleAllDebuffDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: decideCastDebuffOnAll,
});

/**
 * 决定全员 debuff 该施给哪只怪物，返 ActionResult。
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult}
 */
function decideCastDebuffOnAll(event = {}) {
  const opt = event.opt || {};
  const debuffKey = event.debuffKey;
  if (!canCastDebuffOnAll(opt, event, debuffKey)) return { kind: "noop" };
  const skill = DEBUFF_SKILL_LIB.get(debuffKey);
  if (!skill) return { kind: "noop" };
  const aoeCount =
    (event.spellAoe && event.spellAoe[skill.name]) ||
    (opt.debuffSkillAoe && opt.debuffSkillAoe[debuffKey]) ||
    1;
  const sorted = runBattleMonsterView({
    type: BattleMonsterViewEvent.READ_BY_ORDER,
    view: event.monsterFacts,
  }); // 含死序：AoE 邻居覆盖需 order 相邻语义
  const skillIsReady = !!event.skillReady?.[skill.id];

  for (let i = 0; i < sorted.length; i++) {
    const monster = sorted[i];
    if (monster.isDead) continue;
    const verdict = runBattleDebuffApplicability({
      type: BattleDebuffApplicabilityEvent.READ_VERDICT,
      monsterEffects: monster.buffEffects,
      debuffKey,
      opt,
      skillReady: skillIsReady,
    });
    if (verdict === "skip") continue;
    if (verdict === "blocked") {
      return {
        kind: "alert-and-pause",
        msg: {
          l0: `无法正常施放${skill.name}技能,请尝试手动打怪`,
          l1: `無法正常施放${skill.name}技能,請嘗試手動打怪`,
          l2: `Can not cast ${skill.name} skill normally, continue the script?\nPlease try attack manually.`,
        },
      };
    }
    // cast：选目标（AoE≥2 打 order 邻居否则打自己）
    const targetId = runBattleTargetStrategy({
      type: BattleTargetStrategyEvent.AOE_NEIGHBOR_ANCHOR,
      monster,
      nextMonster: sorted[i + 1],
      aoeCount,
    });
    return {
      kind: "click-skill-then-target",
      skillId: skill.id,
      targetId,
    };
  }
  return { kind: "noop" };
}

function canCastDebuffOnAll(opt, event, debuffKey) {
  const gate = ALL_DEBUFF_GATES[debuffKey];
  if (!gate) return false;
  if (gate.skipInStall && event?.stallActive) return false;
  if (!opt.debuffSkillSwitch || !opt[gate.enabledKey]) return false;
  if (shouldSkipDebuffForBigSkill(event, debuffKey)) return false;
  if (!hasMissingDebuff(event, gate.coverageName)) return false;
  return checkCondition(opt[gate.conditionKey], event.conditionFacts);
}

function shouldSkipDebuffForBigSkill(event, kind) {
  if (kind === "We") return !!event?.skipWeakenForBigSkill;
  if (kind === "Im") return !!event?.skipImperilForBigSkill;
  return false;
}

function hasMissingDebuff(event, debuffName) {
  return runBattleDebuffCoverageAutomation({
    type: BattleDebuffCoverageEvent.HAS_MISSING_DEBUFF,
    monsterBuffs: (event?.monsterFacts || []).map((monster) => monster.buffs),
    debuffName,
    monsterAlive: event?.monsterAlive,
  });
}

export function runBattleAllDebuffDecision(event = { type: EVENT_DECIDE }) {
  return battleAllDebuffDecisionEventHandlers[event?.type]?.(event) ?? { kind: "noop" };
}
