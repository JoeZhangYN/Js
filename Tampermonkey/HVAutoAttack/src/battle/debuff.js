// Debuff 系统：可施放性判断 + 单目标 / AoE 全员施放。
// Phase 5b-2 wave 1：castDebuffOnAll 已切 PURE decide-cast-all + SHELL execute-cast-all。
// useDeSkill 待 Phase 5b-3 wave 2。
import { gE, isOn } from "../dom/query.js";
import { g, tagEndToTrue } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { checkCondition } from "../settings/condition-eval.js";
import { DEBUFF_SKILL_LIB } from "../data/debuff-lib.js";
import { needsRecast, getLastBuffTurn, checkAndActivateSpirit } from "./buff.js";
import { pauseChange } from "./main-loop.js";
import { executeCastDebuffOnAll } from "./debuff/execute-cast-all.js";
import { decideDeSkill } from "./debuff/decide-de-skill.js";
import { collectSnapshot } from "./snapshot.js";

export function canApplyDebuff(monsterBuff, debuffKey) {
  const skill = DEBUFF_SKILL_LIB.get(debuffKey);
  if (!needsRecast(monsterBuff, skill.img)) return "skip";
  if (!isOn(skill.id)) return "skip";
  const imgs = gE("img", "all", monsterBuff);
  if (
    imgs.length < 6 ||
    !g("option").debuffSkillTurnAlert ||
    (g("option").debuffSkillTurn &&
      getLastBuffTurn(imgs) >= (g("option").debuffSkillTurn[debuffKey] || 0))
  ) return "cast";
  return "blocked";
}

export function useDeSkill() {
  // Phase 5b-3 wave 2：委托给 PURE decide-de-skill + SHELL adapter
  const snap = collectSnapshot();
  if (!snap.spellAoe) snap.spellAoe = g("spellAoe") || {};
  const result = decideDeSkill(g("option"), snap);
  if (result.kind === "noop") return;
  if (result.kind === "alert-and-pause") {
    _alert(0, result.msg.l0, result.msg.l1, result.msg.l2);
    pauseChange();
    tagEndToTrue();
    return;
  }
  if (result.kind === "click-skill-then-target") {
    if (checkAndActivateSpirit()) return;
    const skillEl = gE(result.skillSel);
    if (!skillEl) return;
    skillEl.click();
    const tgt = gE(result.targetSel);
    if (tgt) tgt.click();
    tagEndToTrue();
  }
}

/**
 * 全员 debuff 施放（Phase 5b-2 wave 1：委托给 PURE decide-cast-all + SHELL execute-cast-all）。
 * 入口签名不变。
 */
export function castDebuffOnAll(debuffKey) {
  executeCastDebuffOnAll(debuffKey);
  // 末尾排序复位（保留以兼容 attack.js 等的 monsterStatus.sort 假设）
  g("monsterStatus").sort((a, b) => a.finWeight - b.finWeight);
}
