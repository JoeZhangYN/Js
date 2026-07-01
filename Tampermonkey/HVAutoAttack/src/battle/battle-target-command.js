// Battle target command: one write entry for monster target clicks and skill-target pairs.
import { gE } from "../dom/query.js";
import { BattleCommandEvidenceEvent, runBattleCommandEvidence } from "./battle-command-evidence.js";
import { BattleSkillCommandEvent, runBattleSkillCommand } from "./battle-skill-command.js";

const EVENT_CLICK_TARGET = "clickTarget";
const EVENT_CLICK_SKILL_THEN_TARGET = "clickSkillThenTarget";
const EVENT_TRY_SKILL_THEN_TARGET = "trySkillThenTarget";

export const BattleTargetCommandEvent = Object.freeze({
  CLICK_TARGET: EVENT_CLICK_TARGET,
  CLICK_SKILL_THEN_TARGET: EVENT_CLICK_SKILL_THEN_TARGET,
  TRY_SKILL_THEN_TARGET: EVENT_TRY_SKILL_THEN_TARGET,
});

function targetSelector(targetId) {
  return `#mkey_${targetId}`;
}

function recordCommandResult(command, result, reason, detail) {
  runBattleCommandEvidence({
    type: BattleCommandEvidenceEvent.RECORD_RESULT,
    command,
    result,
    reason,
    detail,
  });
}

function readLiveTarget(targetId) {
  const targetEl = gE(targetSelector(targetId));
  if (!targetEl) return { targetEl: null, reason: "targetMissing" };
  if (targetEl.querySelector('img[src*="nbardead.png"]')) {
    return { targetEl: null, reason: "targetDead" };
  }
  return { targetEl, reason: "live" };
}

function clickTarget(targetId) {
  const targetEl = gE(targetSelector(targetId));
  if (!targetEl) {
    recordCommandResult("target.click", "rejected", "targetMissing", { targetId });
    return false;
  }
  targetEl.click();
  recordCommandResult("target.click", "accepted", "clicked", { targetId });
  return true;
}

function clickSkillThenTarget(skillId, targetId) {
  const { targetEl, reason } = readLiveTarget(targetId);
  if (!targetEl) {
    recordCommandResult("target.clickSkillThenTarget", "rejected", reason, { skillId, targetId });
    return false;
  }
  if (
    !runBattleSkillCommand({
      type: BattleSkillCommandEvent.CLICK_READY,
      skillId,
    })
  ) {
    recordCommandResult("target.clickSkillThenTarget", "rejected", "skillCommandRejected", {
      skillId,
      targetId,
    });
    return false;
  }
  targetEl.click();
  recordCommandResult("target.clickSkillThenTarget", "accepted", "clicked", { skillId, targetId });
  return true;
}

function trySkillThenTarget(skillId, targetId, afterSkillClick, targetRequiresSkill = false) {
  const clickedSkill = runBattleSkillCommand({
    type: BattleSkillCommandEvent.CLICK_READY,
    skillId,
    afterClick: afterSkillClick,
  });
  if (!clickedSkill && targetRequiresSkill) {
    recordCommandResult("target.trySkillThenTarget", "rejected", "skillRequired", {
      skillId,
      targetId,
    });
    return false;
  }
  const clickedTarget = clickTarget(targetId);
  recordCommandResult("target.trySkillThenTarget", clickedTarget ? "accepted" : "rejected", clickedTarget ? "clicked" : "targetCommandRejected", {
    skillId,
    targetId,
    clickedSkill: Boolean(clickedSkill),
  });
  return clickedTarget;
}

const battleTargetCommandEventHandlers = Object.freeze({
  [EVENT_CLICK_TARGET]: (event) => clickTarget(event.targetId),
  [EVENT_CLICK_SKILL_THEN_TARGET]: (event) => clickSkillThenTarget(event.skillId, event.targetId),
  [EVENT_TRY_SKILL_THEN_TARGET]: (event) =>
    trySkillThenTarget(
      event.skillId,
      event.targetId,
      event.afterSkillClick,
      event.targetRequiresSkill
    ),
});

export function runBattleTargetCommand(event) {
  const handler = battleTargetCommandEventHandlers[event.type];
  if (!handler) {
    recordCommandResult("target.unknown", "rejected", "unknownTargetCommand", {
      eventType: event?.type,
    });
    return false;
  }
  return handler(event);
}
