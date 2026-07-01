// Battle skill command: one write entry for ready-checked skill button clicks.
import { gE, isOn } from "../dom/query.js";
import { clickBattleCommandElement } from "./battle-command-click.js";
import { BattleCommandEvidenceEvent, runBattleCommandEvidence } from "./battle-command-evidence.js";

const EVENT_CLICK_READY = "clickReady";

export const BattleSkillCommandEvent = Object.freeze({
  CLICK_READY: EVENT_CLICK_READY,
});

function recordCommandResult(result, reason, detail) {
  runBattleCommandEvidence({
    type: BattleCommandEvidenceEvent.RECORD_RESULT,
    command: "skill.clickReady",
    result,
    reason,
    detail,
  });
}

function clickReady(skillId, afterClick) {
  if (!isOn(skillId)) {
    recordCommandResult("rejected", "skillNotReady", { skillId });
    return false;
  }
  const el = gE(skillId);
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
