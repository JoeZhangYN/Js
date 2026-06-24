// PURE: 单目标 debuff（useDeSkill）决策。
// 与 castDebuffOnAll 区别：仅施给首目标怪，按 debuffSkillOrderValue 优先级遍历。
import { DEBUFF_SKILL_LIB } from "../../data/debuff-lib.js";
import { checkCondition } from "../../settings/condition-eval.js";
import { canApplyDebuffPure, pickAoeTarget } from "./can-apply.js";

/**
 * 在按 order 升序排好的存活怪里，找 hpRatio 最高（血最多）的下标。
 * 同 hpRatio 取 order 较小者（first 命中、稳定）。
 * @param {import("../../core/types.js").MonsterFacts[]} aliveByOrder
 * @returns {number}
 */
function highestHpIndex(aliveByOrder) {
  let best = 0;
  for (let i = 1; i < aliveByOrder.length; i++) {
    if (aliveByOrder[i].hpRatio > aliveByOrder[best].hpRatio) best = i;
  }
  return best;
}

/**
 * 决定单目标 debuff 该施哪一种。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {import("../../core/types.js").ActionResult}
 */
export function decideDeSkill(opt, snap) {
  const skillPack = (opt.debuffSkillOrderValue || "").split(",").filter(Boolean);
  const sortedAlive = [...snap.monsters].sort((a, b) => a.order - b.order).filter((m) => !m.isDead);
  if (!sortedAlive.length) return { kind: "noop" };

  for (const key of skillPack) {
    if (!opt.debuffSkill?.[key]) continue;
    if (!checkCondition(opt[`debuffSkill${key}Condition`], snap)) continue;
    const skill = DEBUFF_SKILL_LIB.get(key);
    if (!skill) continue;
    // 目标怪：Drain 且开关开启（drainTargetMaxHp，默认开）时打血最多的怪
    //（存活最久 → drain 生效时间最长，价值最大）；其余情况仍打首怪（order 最小）。
    const targetIdx =
      key === "Dr" && opt.drainTargetMaxHp !== false ? highestHpIndex(sortedAlive) : 0;
    const target = sortedAlive[targetIdx];
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
    // cast：AoE≥2 时打邻居（目标怪在 order 序里的下一只），否则打自己
    const aoeCount =
      (snap.spellAoe && snap.spellAoe[skill.name]) ||
      (opt.debuffSkillAoe && opt.debuffSkillAoe[key]) ||
      1;
    const targetId = pickAoeTarget(target, sortedAlive[targetIdx + 1], aoeCount);
    return {
      kind: "click-skill-then-target",
      skillSel: skill.id,
      targetSel: `#mkey_${targetId}`,
    };
  }
  return { kind: "noop" };
}
