// Battle target command: one write entry for monster target clicks and skill-target pairs.
import { clickBattleCommandElement } from "./battle-command-click.js";
import { recordBattleCommandResult } from "./battle-command-recording.js";
import { readLiveTarget, targetReadDetail } from "./battle-target-live-target.js";
import { BattleSkillCommandEvent, runBattleSkillCommand } from "./battle-skill-command.js";

const EVENT_CLICK_TARGET = "clickTarget";
const EVENT_CLICK_SKILL_THEN_TARGET = "clickSkillThenTarget";
const EVENT_TRY_SKILL_THEN_TARGET = "trySkillThenTarget";

export const BattleTargetCommandEvent = Object.freeze({
  CLICK_TARGET: EVENT_CLICK_TARGET,
  CLICK_SKILL_THEN_TARGET: EVENT_CLICK_SKILL_THEN_TARGET,
  TRY_SKILL_THEN_TARGET: EVENT_TRY_SKILL_THEN_TARGET,
});

function recordCommandResult(command, result, reason, detail) {
  recordBattleCommandResult(command, result, reason, detail);
}

function clickTarget(targetId) {
  const { targetEl, reason, error } = readLiveTarget(targetId);
  if (!targetEl) {
    recordCommandResult("target.click", "rejected", reason, targetReadDetail(targetId, { error }));
    return false;
  }
  const clickResult = clickBattleCommandElement(targetEl);
  if (!clickResult.clicked) {
    recordCommandResult("target.click", "rejected", clickResult.reason, {
      targetId,
      error: clickResult.error,
    });
    return false;
  }
  recordCommandResult("target.click", "accepted", "clicked", { targetId });
  return true;
}

function clickSkillThenTarget(skillId, targetId) {
  const { targetEl, reason, error } = readLiveTarget(targetId);
  if (!targetEl) {
    recordCommandResult("target.clickSkillThenTarget", "rejected", reason, {
      skillId,
      ...targetReadDetail(targetId, { error }),
    });
    return false;
  }
  const skillResult = runSkillCommand("target.clickSkillThenTarget", skillId, targetId, {
    type: BattleSkillCommandEvent.CLICK_READY,
    skillId,
  });
  if (skillResult.threw || !skillResult.acted) {
    if (!skillResult.threw) {
      recordCommandResult("target.clickSkillThenTarget", "rejected", "skillCommandRejected", {
        skillId,
        targetId,
      });
    }
    return false;
  }
  const clickResult = clickBattleCommandElement(targetEl);
  if (!clickResult.clicked) {
    recordCommandResult("target.clickSkillThenTarget", "rejected", clickResult.reason, {
      skillId,
      targetId,
      error: clickResult.error,
    });
    return false;
  }
  recordCommandResult("target.clickSkillThenTarget", "accepted", "clicked", { skillId, targetId });
  return true;
}

function runSkillCommand(command, skillId, targetId, event) {
  try {
    return { acted: targetSkillCommandActed(runBattleSkillCommand(event)), threw: false };
  } catch (error) {
    recordCommandResult(command, "rejected", "skillCommandThrew", {
      type: BattleSkillCommandEvent.CLICK_READY,
      skillId,
      targetId,
      error: error?.message || String(error),
    });
    return { acted: false, threw: true };
  }
}

function targetSkillCommandActed(result) {
  if (result?.kind === "failed") return false;
  return Boolean(result);
}

function trySkillThenTarget(skillId, targetId, afterSkillClick, targetRequiresSkill = false) {
  const skillResult = runSkillCommand("target.trySkillThenTarget", skillId, targetId, {
    type: BattleSkillCommandEvent.CLICK_READY,
    skillId,
    afterClick: afterSkillClick,
  });
  if (skillResult.threw) return false;
  if (!skillResult.acted && targetRequiresSkill) {
    recordCommandResult("target.trySkillThenTarget", "rejected", "skillRequired", {
      skillId,
      targetId,
    });
    return false;
  }
  const clickedTarget = clickTarget(targetId);
  recordCommandResult(
    "target.trySkillThenTarget",
    clickedTarget ? "accepted" : "rejected",
    clickedTarget ? "clicked" : "targetCommandRejected",
    {
      skillId,
      targetId,
      clickedSkill: skillResult.acted,
    }
  );
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
  const handler = battleTargetCommandEventHandlers[event?.type];
  if (!handler) {
    recordCommandResult("target.unknown", "rejected", "unknownTargetCommand", {
      eventType: event?.type ?? null,
    });
    return false;
  }
  return handler(event);
}
