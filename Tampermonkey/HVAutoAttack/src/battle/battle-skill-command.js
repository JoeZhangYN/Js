// Battle skill command: one write entry for ready-checked skill button clicks.
import { gE, isOn } from "../dom/query.js";

const EVENT_CLICK_READY = "clickReady";

export const BattleSkillCommandEvent = Object.freeze({
  CLICK_READY: EVENT_CLICK_READY,
});

function clickReady(skillId, afterClick) {
  if (!isOn(skillId)) return false;
  const el = gE(skillId);
  if (!el) return false;
  el.click();
  afterClick?.();
  return true;
}

export function runBattleSkillCommand(event) {
  if (event.type === EVENT_CLICK_READY) return clickReady(event.skillId, event.afterClick);
  return undefined;
}
