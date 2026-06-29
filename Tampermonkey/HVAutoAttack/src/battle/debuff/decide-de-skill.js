// PURE: 单目标 debuff（useDeSkill）决策。从统一怪物视图(snap.view)派生目标，走 target-strategy 具名策略。
// Drain（Dr）+ drainTargetMaxHp(默认开) → 打**当前绝对血最多**的怪（存活最久 → drain 生效时间最长；
// boss 绝对血远超小怪 → 天然 boss 优先），且**恒点该怪本身**（取消邻居偏移，既已锚定就打它）。
// 其余单体 debuff → 首怪(order 最小) + 保留 AoE 邻居覆盖优化。
import { DEBUFF_SKILL_LIB } from "../../data/debuff-lib.js";
import { checkCondition } from "../../settings/condition-eval.js";
import { canApplyDebuffPure } from "./can-apply.js";
import { aliveByOrder } from "../monster-view.js";
import { firstByOrder, highestAbsHp, selfTarget, aoeNeighborAnchor } from "../target-strategy.js";
import { BattleStallModeEvent, runBattleStallModeAutomation } from "../battle-stall-mode.js";

/**
 * 决定单目标 debuff 该施哪一种 + 打哪只怪。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {import("../../core/types.js").ActionResult}
 */
export function decideDeSkill(opt, snap) {
  if (isStallingForDeSkill(opt, snap)) return { kind: "noop" };
  if (
    !opt.debuffSkillSwitch ||
    !opt.debuffSkill ||
    !checkCondition(opt.debuffSkillCondition, snap)
  ) {
    return { kind: "noop" };
  }
  const skillPack = (opt.debuffSkillOrderValue || "").split(",").filter(Boolean);
  const alive = aliveByOrder(snap.view);
  if (!alive.length) return { kind: "noop" };

  for (const key of skillPack) {
    if (!opt.debuffSkill?.[key]) continue;
    if (!checkCondition(opt[`debuffSkill${key}Condition`], snap)) continue;
    const skill = DEBUFF_SKILL_LIB.get(key);
    if (!skill) continue;
    // 目标怪：Drain 且开关开 → 绝对血最多(highestAbsHp)；其余单体 debuff → 首怪(order 最小)。
    const isDrainMaxHp = key === "Dr" && opt.drainTargetMaxHp !== false;
    const target = isDrainMaxHp ? highestAbsHp(alive) : firstByOrder(alive);
    const skillReady = !!snap.skillReady[skill.id];
    const verdict = canApplyDebuffPure(target.buffEffects, key, opt, skillReady);
    if (verdict === "skip") continue;
    if (verdict === "blocked") {
      return {
        kind: "alert-and-pause",
        msg: {
          l0: "无法正常施放DEBUFF技能，请尝试手动打怪",
          l1: "無法正常施放DEBUFF技能，請嘗試手動打怪",
          l2: "Can not cast de-skills normally, continue the script?\nPlease try attack manually.",
        },
      };
    }
    const aoeCount =
      (snap.spellAoe && snap.spellAoe[skill.name]) ||
      (opt.debuffSkillAoe && opt.debuffSkillAoe[key]) ||
      1;
    // Drain 恒点选定的血最多怪本身（取消邻居偏移）；其余 debuff 保留 AoE 邻居覆盖优化（首怪邻居 alive[1]）。
    const targetId = isDrainMaxHp
      ? selfTarget(target)
      : aoeNeighborAnchor(target, alive[1], aoeCount);
    return {
      kind: "click-skill-then-target",
      skillId: skill.id,
      targetId,
    };
  }
  return { kind: "noop" };
}

function isStallingForDeSkill(opt, snap) {
  return runBattleStallModeAutomation({
    type: BattleStallModeEvent.READ_ACTIVE,
    snap,
    opt,
    roundNow: snap?.roundNow,
    roundAll: snap?.roundAll,
  });
}
