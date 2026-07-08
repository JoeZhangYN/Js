// PURE: 物理技能评分（OFC/FRD/T3/T2/T1）。
// A 方案：**state-aware utility scoring**——T1/T2/T3 分数读 event facts 实时算（combo 逻辑），
// 不只是常量 base × multiplier。OFC/FRD 仍用 aoeScore（少怪降级 + 怪数比例）。
// 盾战 combo：T1 stun → T2（晕状态打 T2 = 200 分高优先）→ T3 斩杀（hpRatio<25%+bleed = 1000 分决定性）
import { checkCondition } from "../../settings/condition-eval.js";
import { PhysicalSkillRankingEvent, runPhysicalSkillRanking } from "./physical-skill-ranking.js";
import { BattleMonsterViewEvent, runBattleMonsterView } from "../battle-monster-view.js";
import { BigSkillCatalogEvent, runBigSkillCatalog } from "../big-skill-catalog.js";

const EVENT_SCORE_CANDIDATES = "score-candidates";

export const PhysicalSkillScoringEvent = Object.freeze({
  SCORE_CANDIDATES: EVENT_SCORE_CANDIDATES,
});

const physicalSkillScoringEventHandlers = Object.freeze({
  [EVENT_SCORE_CANDIDATES]: (event) =>
    scorePhysicalSkillCandidates(event.opt, event.event, event.ctx || {}),
});

const PHYSICAL_SKILL_SCORERS = Object.freeze({
  OFC: scoreOfcSkill,
  FRD: scoreFrdSkill,
  T3: scoreT3Skill,
  T2: scoreT2Skill,
  T1: scoreT1Skill,
});

const PHYSICAL_SKILL_BLOCKERS = Object.freeze({
  OFC: ({ downgrade }) => (downgrade ? "downgrade" : null),
  FRD: ({ downgrade }) => (downgrade ? "downgrade" : null),
  T3: () => null,
  T2: () => null,
  T1: ({ firstMonsterStunned }) => (firstMonsterStunned ? "first-stunned-skip-T1" : null),
});

const PHYSICAL_SKILL_EXPLAINERS = Object.freeze({
  OFC: () => "",
  FRD: () => "",
  T3: ({ firstMonster }) =>
    (firstMonster?.hpPercent ?? 1) < 0.25 && firstMonster?.buffs?.includes("wpn_bleed")
      ? " (execute)"
      : "",
  T2: ({ firstMonster }) => (firstMonster?.buffs?.includes("wpn_stun") ? " (T1+T2 combo)" : ""),
  T1: () => "",
});

/**
 * State-aware 打分：传入 event + 首怪 facts，返该 skill 的当前 score（0 = 不该使用）。
 * 用户可通过 opt.skillBaseScore 覆盖 baseline。
 */
function scoreSkillContextual(skill, opt, event, firstMonster) {
  return PHYSICAL_SKILL_SCORERS[skill]?.(opt, event, firstMonster) ?? 0;
}

function scoreOfcSkill(opt, event) {
  const overrides = opt.skillBaseScore || {};
  return runPhysicalSkillRanking({
    type: PhysicalSkillRankingEvent.AOE_SCORE,
    baseScore: overrides.OFC ?? 100,
    aliveCount: event.aliveCount,
  });
}

function scoreFrdSkill(opt, event) {
  const overrides = opt.skillBaseScore || {};
  return runPhysicalSkillRanking({
    type: PhysicalSkillRankingEvent.AOE_SCORE,
    baseScore: overrides.FRD ?? 60,
    aliveCount: event.aliveCount,
  });
}

function scoreT3Skill(opt, _event, firstMonster) {
  const firstBleeding = !!firstMonster?.buffs?.includes("wpn_bleed");
  const firstLowHp = (firstMonster?.hpPercent ?? 1) < 0.25;
  const overrides = opt.skillBaseScore || {};
  if (firstLowHp && firstBleeding) return overrides.T3_execute ?? 1000;
  return overrides.T3 ?? 80;
}

function scoreT2Skill(opt, _event, firstMonster) {
  const firstStunned = !!firstMonster?.buffs?.includes("wpn_stun");
  const overrides = opt.skillBaseScore || {};
  if (firstStunned) return overrides.T2_combo ?? 200;
  return overrides.T2 ?? 60;
}

function scoreT1Skill(opt, _event, firstMonster) {
  const firstStunned = !!firstMonster?.buffs?.includes("wpn_stun");
  const overrides = opt.skillBaseScore || {};
  if (firstStunned) return 0;
  return overrides.T1 ?? 40;
}

function physicalSkillBlockReason(skill, context) {
  return PHYSICAL_SKILL_BLOCKERS[skill]?.(context) ?? null;
}

function explainPhysicalSkillScore(skill, score, context) {
  return `score=${score}${PHYSICAL_SKILL_EXPLAINERS[skill]?.(context) ?? ""}`;
}

/**
 * 给所有物理技能候选打分。返候选数组（含不可用的 score=0），caller 用 pickByUtility 取最高。
 * @param {object} opt
 * @param {object} event
 * @param {{firstMonsterStunned:boolean}} ctx
 * @returns {Array<{code:string,id:string,score:number,oc:number,explain:string}>}
 */
function scorePhysicalSkillCandidates(opt, event, ctx) {
  if (!opt.skillSwitch || !event.spiritOn) return [];
  const skillOrder = (opt.skillOrderValue || "OFC,FRD,T3,T2,T1").split(",");
  const style = opt.fightingStyle || "2";
  const skillLib = new Map([
    ["OFC", runBigSkillCatalog({ type: BigSkillCatalogEvent.READ_SPEC, code: "OFC" })],
    ["FRD", runBigSkillCatalog({ type: BigSkillCatalogEvent.READ_SPEC, code: "FRD" })],
    ["T3", { id: `2${style}03`, oc: 105 }],
    ["T2", { id: `2${style}02`, oc: 55 }],
    ["T1", { id: `2${style}01`, oc: 30 }],
  ]);
  const downgrade =
    opt.physicalSkillDowngrade !== false &&
    event.aliveCount <= (opt.physicalDowngradeThreshold || 3);
  const otosUsed = (key) =>
    !!(opt.skillOTOS && opt.skillOTOS[key] && (event.skillOTOS?.[key] ?? 0) >= 1);
  const ocCur = event.overcharge || 0;

  const firstMonster = runBattleMonsterView({
    type: BattleMonsterViewEvent.READ_ALIVE_BY_ORDER,
    view: event.monsterFacts,
  })[0];
  const scoringContext = {
    downgrade,
    firstMonster,
    firstMonsterStunned: !!ctx.firstMonsterStunned,
  };

  return skillOrder.flatMap((skill) => {
    const info = skillLib.get(skill);
    if (!info) return [];
    // 硬约束：不可用 → score=0
    const blockReason = physicalSkillBlockReason(skill, scoringContext);
    if (blockReason) {
      return [{ code: skill, id: info.id, score: 0, oc: info.oc, explain: blockReason }];
    }
    if (otosUsed(skill) || !event.skillReady?.[info.id] || ocCur < info.oc) {
      return [{ code: skill, id: info.id, score: 0, oc: info.oc, explain: "blocked" }];
    }
    if (!checkCondition(opt[`skill${skill}Condition`], event.conditionFacts)) {
      return [{ code: skill, id: info.id, score: 0, oc: info.oc, explain: "cond-fail" }];
    }
    // 软约束：state-aware 打分
    const score = scoreSkillContextual(skill, opt, event, firstMonster);
    return [
      {
        code: skill,
        id: info.id,
        score,
        oc: info.oc,
        explain: explainPhysicalSkillScore(skill, score, scoringContext),
      },
    ];
  });
}

export function runPhysicalSkillScoring(event = { type: EVENT_SCORE_CANDIDATES }) {
  return physicalSkillScoringEventHandlers[event?.type]?.(event) ?? [];
}
