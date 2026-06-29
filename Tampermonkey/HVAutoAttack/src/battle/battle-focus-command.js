// Focus command: one write entry for clicking the battle Focus button.
import { gE } from "../dom/query.js";

const EVENT_CLICK = "click";

export const BattleFocusCommandEvent = Object.freeze({
  CLICK: EVENT_CLICK,
});

function clickFocus() {
  const el = gE("#ckey_focus");
  if (!el) return false;
  el.click();
  return true;
}

export function runBattleFocusCommand(event = { type: EVENT_CLICK }) {
  if (event.type === EVENT_CLICK) return clickFocus();
  return undefined;
}
