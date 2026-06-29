// Battle target command: one write entry for monster target clicks and skill-target pairs.
import { gE, isOn } from "../dom/query.js";

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
  if (!isOn(skillId)) return false;
  const skillEl = gE(skillId);
  if (!skillEl) return false;
  const targetEl = readLiveTarget(targetId);
  if (!targetEl) return false;
  skillEl.click();
  targetEl.click();
  return true;
}

function trySkillThenTarget(skillId, targetId, afterSkillClick, targetRequiresSkill = false) {
  const skillEl = isOn(skillId) ? gE(skillId) : null;
  if (!skillEl && targetRequiresSkill) return false;
  if (skillEl) {
    skillEl.click();
    afterSkillClick?.();
  }
  clickTarget(targetId);
  return true;
}

export function runBattleTargetCommand(event) {
  if (event.type === EVENT_CLICK_TARGET) return clickTarget(event.targetId);
  if (event.type === EVENT_CLICK_SKILL_THEN_TARGET) {
    return clickSkillThenTarget(event.skillId, event.targetId);
  }
  if (event.type === EVENT_TRY_SKILL_THEN_TARGET) {
    return trySkillThenTarget(
      event.skillId,
      event.targetId,
      event.afterSkillClick,
      event.targetRequiresSkill
    );
  }
  return undefined;
}
