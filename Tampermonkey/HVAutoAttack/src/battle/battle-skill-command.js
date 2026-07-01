// Battle skill command: one write entry for ready-checked skill button clicks.
import { recordNavigationContext } from "../core/navigation-audit.js";
import { gE, isOn } from "../dom/query.js";

const EVENT_CLICK_READY = "clickReady";

export const BattleSkillCommandEvent = Object.freeze({
  CLICK_READY: EVENT_CLICK_READY,
});

function clickReady(skillId, afterClick) {
  if (!isOn(skillId)) return false;
  const el = gE(skillId);
  if (!el) return false;
  recordNavigationContext("battleSkillClick", { skillId });
  el.click();
  afterClick?.();
  return true;
}

const battleSkillCommandEventHandlers = Object.freeze({
  [EVENT_CLICK_READY]: (event) => clickReady(event.skillId, event.afterClick),
});

export function runBattleSkillCommand(event) {
  return battleSkillCommandEventHandlers[event.type]?.(event);
}
