// PURE 决策：基于 snapshot 决定 castDebuffOnAll 的 ActionResult。
// 不读 DOM / 不调 g() / 不写 setValue。
// Phase 5b-2 wave 1 第 2 个 L1 切缝示例。
import { DEBUFF_SKILL_LIB } from "../../data/debuff-lib.js";
import { checkCondition } from "../../settings/condition-eval.js";
import {
  BattleDebuffCoverageEvent,
  runBattleDebuffCoverageAutomation,
} from "../battle-debuff-coverage.js";
import { BattleStallModeEvent, runBattleStallModeAutomation } from "../battle-stall-mode.js";
import { BigSkillDebuffEvent, runBigSkillDebuffAutomation } from "../rules/big-skill.js";
import { canApplyDebuffPure } from "./can-apply.js";
import { byOrder } from "../monster-view.js";
import { aoeNeighborAnchor } from "../target-strategy.js";

const ALL_DEBUFF_GATES = {
  We: {
    enabledKey: "debuffSkillAllWk",
    conditionKey: "debuffSkillWkCondition",
    coverageName: "weaken",
    skipInStall: false,
  },
  Im: {
    enabledKey: "debuffSkillAllIm",
    conditionKey: "debuffSkillImpCondition",
    coverageName: "imperil",
    skipInStall: true,
  },
};

function stallActiveFacts(snap) {
  return {
    roundNow: snap?.roundNow,
    roundAll: snap?.roundAll,
    aliveMonsterHpPercents: (snap?.view || [])
      .filter((monster) => !monster.isDead)
      .map((monster) => monster.hpPercent),
    overcharge: snap?.oc,
  };
}

/**
 * 决定全员 debuff 该施给哪只怪物，返 ActionResult。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @param {string} debuffKey "We" / "Im" / etc
 * @returns {import("../../core/types.js").ActionResult}
 */
export function decideCastDebuffOnAll(opt, snap, debuffKey) {
  if (!canCastDebuffOnAll(opt, snap, debuffKey)) return { kind: "noop" };
  const skill = DEBUFF_SKILL_LIB.get(debuffKey);
  if (!skill) return { kind: "noop" };
  const aoeCount =
    (snap.spellAoe && snap.spellAoe[skill.name]) ||
    (opt.debuffSkillAoe && opt.debuffSkillAoe[debuffKey]) ||
    1;
  const sorted = byOrder(snap.view); // 含死序：AoE 邻居覆盖需 order 相邻语义
  const skillIsReady = !!snap.skillReady[skill.id];

  for (let i = 0; i < sorted.length; i++) {
    const monster = sorted[i];
    if (monster.isDead) continue;
    const verdict = canApplyDebuffPure(monster.buffEffects, debuffKey, opt, skillIsReady);
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
    const targetId = aoeNeighborAnchor(monster, sorted[i + 1], aoeCount);
    return {
      kind: "click-skill-then-target",
      skillId: skill.id,
      targetId,
    };
  }
  return { kind: "noop" };
}

function canCastDebuffOnAll(opt, snap, debuffKey) {
  const gate = ALL_DEBUFF_GATES[debuffKey];
  if (!gate) return false;
  if (gate.skipInStall && isStallingForAllDebuff(opt, snap)) return false;
  if (!opt.debuffSkillSwitch || !opt[gate.enabledKey]) return false;
  if (shouldSkipDebuffForBigSkill(opt, snap, debuffKey)) return false;
  if (!hasMissingDebuff(snap, gate.coverageName)) return false;
  return checkCondition(opt[gate.conditionKey], snap);
}

function shouldSkipDebuffForBigSkill(opt, snap, kind) {
  return runBigSkillDebuffAutomation({
    type: BigSkillDebuffEvent.SHOULD_SKIP_DEBUFF,
    opt,
    snap,
    kind,
  });
}

function hasMissingDebuff(snap, debuffName) {
  return runBattleDebuffCoverageAutomation({
    type: BattleDebuffCoverageEvent.HAS_MISSING_DEBUFF,
    monsterBuffs: (snap?.view || []).map((monster) => monster.buffs),
    debuffName,
    monsterAlive: snap?.monsterAlive,
  });
}

function isStallingForAllDebuff(opt, snap) {
  return runBattleStallModeAutomation({
    type: BattleStallModeEvent.READ_ACTIVE,
    opt,
    ...stallActiveFacts(snap),
  });
}
