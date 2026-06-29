// PURE: 物理技能评分（OFC/FRD/T3/T2/T1）。
// A 方案：**state-aware utility scoring**——T1/T2/T3 分数读 snap 实时算（combo 逻辑），
// 不只是常量 base × multiplier。OFC/FRD 仍用 aoeScore（少怪降级 + 怪数比例）。
// 盾战 combo：T1 stun → T2（晕状态打 T2 = 200 分高优先）→ T3 斩杀（hpRatio<25%+bleed = 1000 分决定性）
import { checkCondition } from "../../settings/condition-eval.js";
import { aoeScore } from "./physical-skill-ranking.js";
import { aliveByOrder } from "../monster-view.js";

/**
 * State-aware 打分：传入 snap + 首怪 facts，返该 skill 的当前 score（0 = 不该使用）。
 * 用户可通过 opt.skillBaseScore 覆盖 baseline。
 */
function scoreSkillContextual(skill, opt, snap, firstMonster) {
  const firstStunned = !!firstMonster?.buffs?.includes("wpn_stun");
  const firstBleeding = !!firstMonster?.buffs?.includes("wpn_bleed");
  const firstLowHp = (firstMonster?.hpPercent ?? 1) < 0.25;
  const overrides = opt.skillBaseScore || {};
  switch (skill) {
    case "OFC":
      return aoeScore(overrides.OFC ?? 100, snap.aliveCount); // 全体 void：每怪 100
    case "FRD":
      return aoeScore(overrides.FRD ?? 60, snap.aliveCount); // 全体 void + 眩晕
    case "T3":
      // 斩杀条件命中 = 1000（碾压所有选项）；普通情况 80
      if (firstLowHp && firstBleeding) return overrides.T3_execute ?? 1000;
      return overrides.T3 ?? 80;
    case "T2":
      // COMBO：首怪 stun 状态 = 200 高优先；普通 60
      if (firstStunned) return overrides.T2_combo ?? 200;
      return overrides.T2 ?? 60;
    case "T1":
      // 已 stun 状态打 T1 浪费（重置 stun 计时但 T2 已可用）
      if (firstStunned) return 0;
      return overrides.T1 ?? 40;
    default:
      return 0;
  }
}

/**
 * 给所有物理技能候选打分。返候选数组（含不可用的 score=0），caller 用 pickByUtility 取最高。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @param {{firstMonsterStunned:boolean}} ctx
 * @returns {Array<{code:string,id:string,score:number,oc:number,explain:string}>}
 */
export function scorePhysicalSkillCandidates(opt, snap, ctx) {
  if (!opt.skillSwitch || !snap.spiritOn) return [];
  const skillOrder = (opt.skillOrderValue || "OFC,FRD,T3,T2,T1").split(",");
  const style = snap.fightingStyle || "2";
  const skillLib = new Map([
    ["OFC", { id: "1111", oc: 205 }],
    ["FRD", { id: "1101", oc: 105 }],
    ["T3", { id: `2${style}03`, oc: 105 }],
    ["T2", { id: `2${style}02`, oc: 55 }],
    ["T1", { id: `2${style}01`, oc: 30 }],
  ]);
  const downgrade =
    opt.physicalSkillDowngrade !== false &&
    snap.aliveCount <= (opt.physicalDowngradeThreshold || 3);
  const otosUsed = (key) =>
    !!(opt.skillOTOS && opt.skillOTOS[key] && (snap.skillOTOS?.[key] ?? 0) >= 1);
  const ocCur = snap.oc || 0;

  const firstMonster = aliveByOrder(snap.view)[0];

  return skillOrder.flatMap((skill) => {
    const info = skillLib.get(skill);
    if (!info) return [];
    // 硬约束：不可用 → score=0
    if (downgrade && (skill === "OFC" || skill === "FRD")) {
      return [{ code: skill, id: info.id, score: 0, oc: info.oc, explain: "downgrade" }];
    }
    if (ctx.firstMonsterStunned && skill === "T1") {
      return [
        { code: skill, id: info.id, score: 0, oc: info.oc, explain: "first-stunned-skip-T1" },
      ];
    }
    if (otosUsed(skill) || !snap.skillReady[info.id] || ocCur < info.oc) {
      return [{ code: skill, id: info.id, score: 0, oc: info.oc, explain: "blocked" }];
    }
    if (!checkCondition(opt[`skill${skill}Condition`], snap)) {
      return [{ code: skill, id: info.id, score: 0, oc: info.oc, explain: "cond-fail" }];
    }
    // 软约束：state-aware 打分
    const score = scoreSkillContextual(skill, opt, snap, firstMonster);
    let explain = `score=${score}`;
    if (skill === "T2" && firstMonster?.buffs?.includes("wpn_stun")) explain += " (T1+T2 combo)";
    if (
      skill === "T3" &&
      (firstMonster?.hpPercent ?? 1) < 0.25 &&
      firstMonster?.buffs?.includes("wpn_bleed")
    )
      explain += " (execute)";
    return [{ code: skill, id: info.id, score, oc: info.oc, explain }];
  });
}
