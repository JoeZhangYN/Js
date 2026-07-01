// SHELL: 把 decideChannel 的 ChannelPlan 翻译为 DOM 副作用 + 中断记账。
// 只写不判断（判断全在 decide-channel.js）；isOn 探活属写路径安全读（与原 useChannelSkill 一致）。
import { recordActionEffectEvidence } from "../battle-action-effect-recording.js";
import { BattleSkillCommandEvent, runBattleSkillCommand } from "../battle-skill-command.js";

const EVENT_APPLY_PLAN = "applyPlan";
const EVENT_UNKNOWN_CHANNEL_EXECUTION = "unknownChannelExecutionEvent";

export const BattleChannelExecutionEvent = Object.freeze({
  APPLY_PLAN: EVENT_APPLY_PLAN,
});

const battleChannelExecutionEventHandlers = Object.freeze({
  [EVENT_APPLY_PLAN]: (event) => applyChannelPlan(event.plan),
});

const CHANNEL_PLAN_EXECUTORS = Object.freeze({
  click: executeClickPlan,
});

/**
 * @param {import("./decide-channel.js").ChannelPlan} plan
 * @returns {boolean} acted —— 是否已触发副作用
 */
function applyChannelPlan(plan) {
  try {
    return CHANNEL_PLAN_EXECUTORS[plan?.type]?.(plan) ?? false;
  } catch (error) {
    recordChannelExecutionFailure(plan, "channelSkillCommandThrew", error);
    return false;
  }
}

function executeClickPlan(plan) {
  // 原 useChannelSkill 三段均在 isOn 通过后 click；探活与 turn 入口快照一致。
  return !!runBattleSkillCommand({
    type: BattleSkillCommandEvent.CLICK_READY,
    skillId: plan.skillId,
  });
}

function recordChannelExecutionFailure(plan, reason, error) {
  recordActionEffectEvidence({
    result: {
      kind: "channel-execution-event",
      reason,
      planType: plan?.type ?? null,
      skillId: plan?.skillId ?? null,
    },
    acted: false,
    knownResultKind: true,
    failureReason: reason,
    executionError: error?.message || String(error),
  });
}

function rejectUnknownChannelExecutionEvent(event) {
  recordActionEffectEvidence({
    result: {
      kind: "unknown-channel-execution-event",
      reason: EVENT_UNKNOWN_CHANNEL_EXECUTION,
      eventType: event?.type ?? null,
    },
    acted: false,
    knownResultKind: false,
    failureReason: EVENT_UNKNOWN_CHANNEL_EXECUTION,
  });
  return false;
}

export function runBattleChannelExecution(event = { type: EVENT_APPLY_PLAN }) {
  return (
    battleChannelExecutionEventHandlers[event?.type]?.(event) ??
    rejectUnknownChannelExecutionEvent(event)
  );
}
