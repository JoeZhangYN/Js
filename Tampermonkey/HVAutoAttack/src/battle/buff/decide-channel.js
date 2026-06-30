// PURE: channeling 期 3 段 fallback 链决策（零 DOM）。忠实复刻 buff.js::useChannelSkill 优先级：
//   0. channelSkillSwitch + channelSkill + snap.channeling 入口守卫
//   1. channelSkill 列表（buffSkillOrderValue 序，recast query && skillReady → click BUFF_SKILL_LIB.id）
//   2. channelSkill2（channelSkill2OrderValue 序，skillReady → click skillId）
//   3. buff 续施（playerEffects 升序，turns<=1：Cloak of the Fallen→422 / NAME_TO_BUFF_CODE→lib.id）
// 只读 explicit channel facts，**禁** gE/isOn/querySelector/document。
// 原 isOn(x) → event.skillReady[x]；
// 原 DOM buff 探活 → event.playerEffects（明细 img/name/turns）+ event.playerBuffs（img 名列表）。
import { BUFF_SKILL_LIB } from "../../data/buff-lib.js";
import { NAME_TO_BUFF_CODE } from "../../data/spell-lib.js";
import { BattlePlayerBuffStateEvent, runBattlePlayerBuffState } from "../player-buff-state.js";

/**
 * @param {object} event
 * @returns {{kind:"channel-plan", plan: import("./decide-channel.js").ChannelPlan}}
 */
export function decideChannel(event = {}) {
  return { kind: "channel-plan", plan: decidePlan(event) };
}

/**
 * channel 决策计划。三段按优先级，返第一个命中的 click，否则 noop。
 * @typedef {{ type:"click", skillId:string } | { type:"noop" }} ChannelPlan
 */

/** @returns {ChannelPlan} */
function decidePlan(event) {
  const opt = event.opt || {};
  const skillReady = event.skillReady || {};
  if (!opt.channelSkillSwitch || !opt.channelSkill || !event.channeling) return { type: "noop" };

  // —— 第一段：施放 Channel 技能（按 buffSkillOrderValue 序）——
  const channelSkill = opt.channelSkill;
  if (channelSkill) {
    const skillPack = (opt.buffSkillOrderValue || "").split(",").filter(Boolean);
    for (const j of skillPack) {
      const lib = BUFF_SKILL_LIB.get(j);
      if (!lib) continue;
      if (
        channelSkill[j] &&
        runBattlePlayerBuffState({
          type: BattlePlayerBuffStateEvent.SHOULD_RECAST,
          state: event,
          img: lib.img,
        }) &&
        skillReady[lib.id]
      ) {
        return { type: "click", skillId: lib.id };
      }
    }
  }

  // —— 第二段：使用其他技能（channelSkill2，按 channelSkill2OrderValue 序）——
  if (opt.channelSkill2 && opt.channelSkill2OrderValue) {
    const order = opt.channelSkill2OrderValue.split(",").filter(Boolean);
    for (const skillId of order) {
      if (skillReady[skillId]) {
        return { type: "click", skillId };
      }
    }
  }

  // —— 第三段：重新施放最先消失的 Buff ——
  // 永续（Infinity）与卷轴 buff（_scroll）不参与"最先消失"续施排序；按 turns 升序。
  const buffs = (event.playerEffects || [])
    .filter((e) => e.turns !== Infinity && !e.img.endsWith("_scroll"))
    .sort((a, b) => a.turns - b.turns);

  for (const { name, turns } of buffs) {
    if (turns > 1) continue; // recast query 守卫：只续即将消失的 buff（turns<=1）

    // Cloak of the Fallen：玩家无 sparklife buff 且 422 ready → 续 Spark of Life
    if (
      name === "Cloak of the Fallen" &&
      !runBattlePlayerBuffState({
        type: BattlePlayerBuffStateEvent.READ_ACTIVE,
        state: event,
        img: "sparklife",
      }) &&
      skillReady["422"]
    ) {
      return { type: "click", skillId: "422" };
    }

    if (NAME_TO_BUFF_CODE.has(name)) {
      const skillCode = NAME_TO_BUFF_CODE.get(name);
      const lib = BUFF_SKILL_LIB.get(skillCode);
      if (lib && skillReady[lib.id]) {
        return { type: "click", skillId: lib.id };
      }
    }
  }

  return { type: "noop" };
}
