// Buff 与 Channeling 系统：施放 / 续施判断 / 元素灌注 / pre-cast Spirit Stance。
// Phase 5b-2 wave 1：useBuffSkill 已切 PURE decide-buff.js + SHELL execute-buff.js。
// 其余（useChannelSkill / useInfusions）待 Phase 5b-3 wave 2 处理。
// file-size-gate: exempt phase-4-monolith
import { gE, isOn } from "../dom/query.js";
import { g, tagEndToTrue } from "../state/store.js";
import { checkCondition } from "../settings/condition-eval.js";
import { BUFF_SKILL_LIB } from "../data/buff-lib.js";
import { NAME_TO_BUFF_CODE } from "../data/spell-lib.js";
import { executeBuffSkill } from "./buff/execute-buff.js";
import { decideInfusion } from "./buff/decide-infusion.js";
import { parseEffectTurns, parseEffectName } from "./effect-parse.js";

export function useChannelSkill() {
  const paneEffects = gE("#pane_effects");
  if (!paneEffects || !paneEffects.querySelector('img[src*="channeling"]'))
    return;

  const option = g("option");
  const skillPack = option.buffSkillOrderValue.split(",");
  const channelSkill = option.channelSkill;

  // 第一步：施放Channel技能
  if (channelSkill) {
    for (const j of skillPack) {
      if (
        channelSkill[j] &&
        needsRecast(paneEffects, BUFF_SKILL_LIB.get(j).img) &&
        isOn(BUFF_SKILL_LIB.get(j).id)
      ) {
        gE(BUFF_SKILL_LIB.get(j).id).click();
        tagEndToTrue();
        return;
      }
    }
  }

  // 第二步：使用其他技能
  if (option.channelSkill2 && option.channelSkill2OrderValue) {
    const order = option.channelSkill2OrderValue.split(",");
    for (const skillId of order) {
      if (isOn(skillId)) {
        gE(skillId).click();
        tagEndToTrue();
        return;
      }
    }
  }

  // 第三步：重新施放最先消失的Buff
  // 修复：原代码按 DOM 顺序遍历首个非 scroll buff 就重施，与注释"最先消失"不符且无 needsRecast 守卫
  // → 每回合无脑 re-cast 第一个 buff，浪费 MP。
  // 修法：(a) 按 buffLastTime 升序排（最先消失优先）；(b) 加 needsRecast(remaining<=1) 守卫，避免重复刷
  const buffs = [...paneEffects.querySelectorAll("img")]
    .map((buff) => ({
      buff,
      spellName: parseEffectName(buff),
      buffLastTime: parseEffectTurns(buff),
    }))
    // 永续（Infinity）与卷轴 buff 不参与"最先消失"续施排序
    .filter(({ buff, buffLastTime }) => buffLastTime !== Infinity && !buff.src.match(/_scroll.png$/))
    .sort((a, b) => a.buffLastTime - b.buffLastTime);

  for (const { spellName, buffLastTime } of buffs) {
    if (buffLastTime > 1) continue; // needsRecast 守卫：只续即将消失的 buff

    if (
      spellName === "Cloak of the Fallen" &&
      !paneEffects.querySelector('img[src*="sparklife"]') &&
      isOn("422")
    ) {
      gE("422").click();
      tagEndToTrue();
      return;
    }

    if (NAME_TO_BUFF_CODE.has(spellName)) {
      const skillCode = NAME_TO_BUFF_CODE.get(spellName);
      const skillInfo = BUFF_SKILL_LIB.get(skillCode);
      if (isOn(skillInfo.id)) {
        gE(skillInfo.id).click();
        tagEndToTrue();
        return;
      }
    }
  }
}

export function checkAndActivateSpirit() {
  if (!g("option").preCastSS) {
    return false;
  }

  if (!checkCondition(g("option").preCastSSCondition)) {
    return false;
  }

  const spiritElement = gE("#ckey_spirit");
  if (!spiritElement) {
    return false;
  }

  const spiritOn = spiritElement.src.includes("spirit_a");
  if (spiritOn) {
    return false;
  }

  spiritElement.click();
  tagEndToTrue();
  return true;
}

export function needsRecast(paneEffects, imgSrc) {
  // 精确文件名匹配防 substring 冲突（regen ↔ regeneration / haste ↔ hastened / absorb ↔ absorbing）
  const existing = paneEffects.querySelector(`img[src$="/${imgSrc}.png"]`);
  if (!existing) return true;
  // 无法解析 / 永续（autocast/permanent）→ parseEffectTurns 返 Infinity → 不重施（保守省 MP）；
  // buff 真消失时 existing 为 null 已在上方触发重施
  return parseEffectTurns(existing) <= 1;
}

/**
 * Buff 施放（Phase 5b-2 wave 1：委托给 PURE decide-buff + SHELL execute-buff）。
 * @param {import("../core/types.js").BattleSnapshot} snap 当前 turn 快照（main() 透传）
 */
export function useBuffSkill(snap) {
  executeBuffSkill(snap);
}

/** @param {import("../core/types.js").BattleSnapshot} snap 当前 turn 快照（main() 透传） */
export function useInfusions(snap) {
  // Phase 5b-3 wave 2：委托给 PURE decide-infusion。
  const result = decideInfusion(g("option"), snap);
  if (result.kind === "click") {
    const el = gE(result.selector);
    if (el) {
      el.click();
      tagEndToTrue();
    }
  }
}
