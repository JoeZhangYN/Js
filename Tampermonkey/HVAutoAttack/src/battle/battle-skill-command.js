// Battle skill command: one write entry for ready-checked skill button clicks.
import { gE, isOn } from "../dom/query.js";
import { clickBattleCommandElement } from "./battle-command-click.js";
import { recordBattleCommandResult } from "./battle-command-recording.js";

const EVENT_CLICK_READY = "clickReady";

export const BattleSkillCommandEvent = Object.freeze({
  CLICK_READY: EVENT_CLICK_READY,
});

function recordCommandResult(result, reason, detail) {
  recordBattleCommandResult("skill.clickReady", result, reason, detail);
}

function clickReady(skillId, afterClick) {
  const readiness = readSkillReadiness(skillId);
  if (readiness.error) {
    recordCommandResult("rejected", "skillReadinessReadFailed", {
      skillId,
      error: readiness.error,
    });
    return false;
  }
  if (!readiness.ready) {
    recordCommandResult("rejected", "skillNotReady", { skillId });
    return false;
  }
  const element = readSkillElement(skillId);
  if (element.error) {
    recordCommandResult("rejected", "skillElementReadFailed", {
      skillId,
      error: element.error,
    });
    return false;
  }
  const el = element.el;
  if (!el) {
    recordCommandResult("rejected", "skillElementMissing", { skillId });
    return false;
  }
  const clickResult = clickBattleCommandElement(el);
  if (!clickResult.clicked) {
    recordCommandResult("rejected", clickResult.reason, { skillId, error: clickResult.error });
    return false;
  }
  try {
    afterClick?.();
  } catch (error) {
    recordCommandResult("accepted", "clicked", {
      skillId,
      afterClickError: error?.message || String(error),
    });
    return true;
  }
  recordCommandResult("accepted", "clicked", { skillId });
  return true;
}

function readSkillReadiness(skillId) {
  try {
    return { ready: Boolean(isOn(skillId)) };
  } catch (error) {
    return { ready: false, error: error?.message || String(error) };
  }
}

function readSkillElement(skillId) {
  try {
    return { el: gE(skillId) };
  } catch (error) {
    return { el: null, error: error?.message || String(error) };
  }
}

const battleSkillCommandEventHandlers = Object.freeze({
  [EVENT_CLICK_READY]: (event) => clickReady(event.skillId, event.afterClick),
});

export function runBattleSkillCommand(event) {
  const handler = battleSkillCommandEventHandlers[event?.type];
  if (!handler) {
    recordCommandResult("rejected", "unknownSkillCommand", { eventType: event?.type ?? null });
    return false;
  }
  return handler(event);
}
