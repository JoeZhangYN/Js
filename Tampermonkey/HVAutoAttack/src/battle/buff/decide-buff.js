// PURE 决策：基于 snapshot 决定 useBuffSkill 应触发哪个 ActionResult。
// 不读 DOM / 不调 g() / 不写 setValue —— 单元测试零依赖。
// Phase 5b-2 wave 1 第 1 个 L1 切缝示例。
import { BUFF_SKILL_LIB } from "../../data/buff-lib.js";
import { checkCondition } from "../../settings/condition-eval.js";
import { itemSelector } from "../../dom/selectors.js";

const DRAUGHT_PACK = [
  ["HD", { id: 11191, img: "healthpot" }],
  ["MD", { id: 11291, img: "manapot" }],
  ["SD", { id: 11391, img: "spiritpot" }],
  ["FV", { id: 19111, img: "flowers" }],
  ["BG", { id: 19131, img: "gum" }],
];

/**
 * 决定本 turn 是否要施 buff / 用 draught，返 ActionResult。
 * @param {object} opt battle rule option subset
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {import("../../core/types.js").ActionResult}
 */
export function decideBuff(opt, snap) {
  const buffSkill = opt.buffSkill;
  if (!buffSkill) return { kind: "noop" };
  const skillPack = (opt.buffSkillOrderValue || "").split(",").filter(Boolean);

  // Phase 1: buff 法术（含 pre-cast Spirit）
  for (const skill of skillPack) {
    if (!buffSkill[skill]) continue;
    if (!checkCondition(opt[`buffSkill${skill}Condition`], snap)) continue;
    const lib = BUFF_SKILL_LIB.get(skill);
    if (!lib) continue;
    const turnsLeft = snap.playerEffectTurns[lib.img];
    // needsRecast: img 不存在（undefined）or 剩余 ≤ 1
    if (turnsLeft != null && turnsLeft > 1) continue;
    if (!snap.skillReady[lib.id]) continue;

    // 是否需要先开 Spirit Stance？
    if (opt.preCastSS && !snap.spiritOn && checkCondition(opt.preCastSSCondition, snap)) {
      return { kind: "click", selector: "#ckey_spirit" };
    }
    return { kind: "click", selector: lib.id };
  }

  // Phase 2: draughts (items 5 个)
  for (const [key, draught] of DRAUGHT_PACK) {
    if (snap.playerBuffs.includes(draught.img)) continue;
    if (!buffSkill[key]) continue;
    if (!checkCondition(opt[`buffSkill${key}Condition`], snap)) continue;
    return {
      kind: "click",
      selector: itemSelector(draught.id),
    };
  }

  return { kind: "noop" };
}
