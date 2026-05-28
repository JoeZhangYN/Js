// PURE: 单目标 debuff（useDeSkill）决策。
// 与 castDebuffOnAll 区别：仅施给首目标怪，按 debuffSkillOrderValue 优先级遍历。
import { DEBUFF_SKILL_LIB } from "../../data/debuff-lib.js";
import { checkCondition } from "../../settings/condition-eval.js";
import { canApplyDebuffPure } from "./can-apply.js";

/**
 * 决定单目标 debuff 该施哪一种。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {import("../../core/types.js").ActionResult}
 */
export function decideDeSkill(opt, snap) {
  const skillPack = (opt.debuffSkillOrderValue || "").split(",").filter(Boolean);
  const sortedAlive = [...snap.monsters].sort((a, b) => a.order - b.order).filter((m) => !m.isDead);
  const firstMonster = sortedAlive[0];
  if (!firstMonster) return { kind: "noop" };

  for (const key of skillPack) {
    if (!opt.debuffSkill?.[key]) continue;
    if (!checkCondition(opt[`debuffSkill${key}Condition`], snap)) continue;
    const skill = DEBUFF_SKILL_LIB.get(key);
    if (!skill) continue;
    const skillReady = !!snap.skillReady[skill.id];
    const verdict = canApplyDebuffPure(firstMonster.buffEffects, key, opt, skillReady);
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
    // cast：AoE≥2 时打邻居，否则打自己
    const aoeCount =
      (snap.spellAoe && snap.spellAoe[skill.name]) ||
      (opt.debuffSkillAoe && opt.debuffSkillAoe[key]) ||
      1;
    const next = sortedAlive[1];
    const targetId = aoeCount >= 2 && next && !next.isDead ? next.id : firstMonster.id;
    return {
      kind: "click-skill-then-target",
      skillSel: skill.id,
      targetSel: `#mkey_${targetId}`,
    };
  }
  return { kind: "noop" };
}
