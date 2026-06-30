// Battle target command: one write entry for monster target clicks and skill-target pairs.
import { gE } from "../dom/query.js";
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

function readLiveTarget(targetId) {
  const targetEl = gE(targetSelector(targetId));
  if (!targetEl) return null;
  if (targetEl.querySelector('img[src*="nbardead.png"]')) return null;
  return targetEl;
}

function clickTarget(targetId) {
  const targetEl = gE(targetSelector(targetId));
  if (!targetEl) return false;
  targetEl.click();
  return true;
}

function clickSkillThenTarget(skillId, targetId) {
  const targetEl = readLiveTarget(targetId);
  if (!targetEl) return false;
  if (
    !runBattleSkillCommand({
      type: BattleSkillCommandEvent.CLICK_READY,
      skillId,
    })
  ) {
    return false;
  }
  targetEl.click();
  return true;
}

function trySkillThenTarget(skillId, targetId, afterSkillClick, targetRequiresSkill = false) {
  const clickedSkill = runBattleSkillCommand({
    type: BattleSkillCommandEvent.CLICK_READY,
    skillId,
    afterClick: afterSkillClick,
  });
  if (!clickedSkill && targetRequiresSkill) return false;
  clickTarget(targetId);
  return true;
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
  return battleTargetCommandEventHandlers[event.type]?.(event);
}
