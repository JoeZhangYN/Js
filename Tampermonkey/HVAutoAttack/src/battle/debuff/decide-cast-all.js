// PURE 决策：基于 snapshot 决定 castDebuffOnAll 的 ActionResult。
// 不读 DOM / 不调 g() / 不写 setValue。
// Phase 5b-2 wave 1 第 2 个 L1 切缝示例。
import { DEBUFF_SKILL_LIB } from "../../data/debuff-lib.js";
import { canApplyDebuffPure } from "./can-apply.js";

/**
 * 决定全员 debuff 该施给哪只怪物，返 ActionResult。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @param {string} debuffKey "We" / "Im" / etc
 * @returns {import("../../core/types.js").ActionResult}
 */
export function decideCastDebuffOnAll(opt, snap, debuffKey) {
  const skill = DEBUFF_SKILL_LIB.get(debuffKey);
  if (!skill) return { kind: "noop" };
  const aoeCount =
    (snap.spellAoe && snap.spellAoe[skill.name]) ||
    (opt.debuffSkillAoe && opt.debuffSkillAoe[debuffKey]) ||
    1;
  const sorted = [...snap.monsters].sort((a, b) => a.order - b.order);
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
    // cast：选目标
    const next = sorted[i + 1];
    const targetId = aoeCount >= 2 && next && !next.isDead ? next.id : monster.id;
    return {
      kind: "click-skill-then-target",
      skillSel: skill.id,
      targetSel: `#mkey_${targetId}`,
    };
  }
  return { kind: "noop" };
}
