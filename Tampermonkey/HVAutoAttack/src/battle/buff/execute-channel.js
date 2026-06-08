// SHELL: 把 decideChannel 的 ChannelPlan 翻译为 DOM 副作用 + 中断记账。
// 只写不判断（判断全在 decide-channel.js）；isOn 探活属写路径安全读（与原 useChannelSkill 一致）。
import { gE, isOn } from "../../dom/query.js";
import { tagEndToTrue } from "../../state/store.js";

/**
 * @param {import("./decide-channel.js").ChannelPlan} plan
 * @returns {boolean} acted —— 是否已触发副作用
 */
export function executeChannel(plan) {
  if (plan.type === "click") {
    // 原 useChannelSkill 三段均在 isOn 通过后 click；探活与 turn 入口快照一致。
    if (isOn(plan.skillId)) gE(plan.skillId).click();
    tagEndToTrue();
    return true;
  }
  return false;
}
