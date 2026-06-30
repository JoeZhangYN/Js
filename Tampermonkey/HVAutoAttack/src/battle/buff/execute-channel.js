// SHELL: 把 decideChannel 的 ChannelPlan 翻译为 DOM 副作用 + 中断记账。
// 只写不判断（判断全在 decide-channel.js）；isOn 探活属写路径安全读（与原 useChannelSkill 一致）。
import { BattleSkillCommandEvent, runBattleSkillCommand } from "../battle-skill-command.js";

const EVENT_APPLY_PLAN = "applyPlan";

export const BattleChannelExecutionEvent = Object.freeze({
  APPLY_PLAN: EVENT_APPLY_PLAN,
});

/**
 * @param {import("./decide-channel.js").ChannelPlan} plan
 * @returns {boolean} acted —— 是否已触发副作用
 */
function applyChannelPlan(plan) {
  if (plan.type === "click") {
    // 原 useChannelSkill 三段均在 isOn 通过后 click；探活与 turn 入口快照一致。
    runBattleSkillCommand({
      type: BattleSkillCommandEvent.CLICK_READY,
      skillId: plan.skillId,
    });
    return true;
  }
  return false;
}

export function runBattleChannelExecution(event = { type: EVENT_APPLY_PLAN }) {
  if (event.type === EVENT_APPLY_PLAN) return applyChannelPlan(event.plan);
  return false;
}
