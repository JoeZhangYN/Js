// Focus command: one write entry for clicking the battle Focus button.
import { recordNavigationContext } from "../core/navigation-audit.js";
import { gE } from "../dom/query.js";

const EVENT_CLICK = "click";

export const BattleFocusCommandEvent = Object.freeze({
  CLICK: EVENT_CLICK,
});

function clickFocus() {
  const el = gE("#ckey_focus");
  if (!el) return false;
  recordNavigationContext("battleFocusClick");
  el.click();
  return true;
}

const battleFocusCommandEventHandlers = Object.freeze({
  [EVENT_CLICK]: () => clickFocus(),
});

export function runBattleFocusCommand(event = { type: EVENT_CLICK }) {
  return battleFocusCommandEventHandlers[event.type]?.(event);
}
