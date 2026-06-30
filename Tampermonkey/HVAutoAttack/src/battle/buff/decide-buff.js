// PURE 决策：基于 snapshot 决定 useBuffSkill 应触发哪个 ActionResult。
// 不读 DOM / 不调 g() / 不写 setValue —— 单元测试零依赖。
// Phase 5b-2 wave 1 第 1 个 L1 切缝示例。
import { BUFF_SKILL_LIB } from "../../data/buff-lib.js";
import { checkCondition } from "../../settings/condition-eval.js";
import { isPlayerBuffActive, shouldRecastPlayerBuff } from "../player-buff-state.js";

const DRAUGHT_PACK = [
  ["HD", { id: 11191, img: "healthpot" }],
  ["MD", { id: 11291, img: "manapot" }],
  ["SD", { id: 11391, img: "spiritpot" }],
  ["FV", { id: 19111, img: "flowers" }],
  ["BG", { id: 19131, img: "gum" }],
];

/**
 * 决定本 turn 是否要施 buff / 用 draught，返 ActionResult。
 * @param {object} event battle rule option subset and buff facts
 * @returns {import("../../core/types.js").ActionResult}
 */
export function decideBuff(event = {}) {
  const opt = event.opt || {};
  if (!opt.buffSkillSwitch || !checkCondition(opt.buffSkillCondition, event.conditionFacts)) {
    return { kind: "noop" };
  }
  const buffSkill = opt.buffSkill;
  if (!buffSkill) return { kind: "noop" };
  const skillPack = (opt.buffSkillOrderValue || "").split(",").filter(Boolean);

  // Phase 1: buff 法术（含 pre-cast Spirit）
  for (const skill of skillPack) {
    if (!buffSkill[skill]) continue;
    if (!checkCondition(opt[`buffSkill${skill}Condition`], event.conditionFacts)) continue;
    const lib = BUFF_SKILL_LIB.get(skill);
    if (!lib) continue;
    if (!shouldRecastPlayerBuff(event, lib.img)) continue;
    if (!event.skillReady?.[lib.id]) continue;

    // 是否需要先开 Spirit Stance？
    if (
      opt.preCastSS &&
      !event.spiritOn &&
      checkCondition(opt.preCastSSCondition, event.conditionFacts)
    ) {
      return { kind: "toggle-spirit" };
    }
    return { kind: "skill-command", skillId: lib.id };
  }

  // Phase 2: draughts (items 5 个)
  for (const [key, draught] of DRAUGHT_PACK) {
    if (isPlayerBuffActive(event, draught.img)) continue;
    if (!buffSkill[key]) continue;
    if (!checkCondition(opt[`buffSkill${key}Condition`], event.conditionFacts)) continue;
    return {
      kind: "item-command",
      itemId: draught.id,
    };
  }

  return { kind: "noop" };
}
