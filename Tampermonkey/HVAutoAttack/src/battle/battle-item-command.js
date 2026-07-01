// Battle item command: one write entry for gem and inventory item button clicks.
import { recordNavigationContext } from "../core/navigation-audit.js";
import { gE } from "../dom/query.js";
import { itemSelector } from "../dom/selectors.js";

const EVENT_CLICK_GEM = "clickGem";
const EVENT_CLICK_ITEM = "clickItem";

export const BattleItemCommandEvent = Object.freeze({
  CLICK_GEM: EVENT_CLICK_GEM,
  CLICK_ITEM: EVENT_CLICK_ITEM,
});

function clickGem() {
  const el = gE("#ikey_p");
  if (!el) return false;
  recordNavigationContext("battleGemClick");
  el.click();
  return true;
}

function clickItem(itemId, beforeClick) {
  const el = gE(itemSelector(itemId));
  if (!el) return false;
  beforeClick?.();
  recordNavigationContext("battleItemClick", { itemId });
  el.click();
  return true;
}

const battleItemCommandEventHandlers = Object.freeze({
  [EVENT_CLICK_GEM]: () => clickGem(),
  [EVENT_CLICK_ITEM]: (event) => clickItem(event.itemId, event.beforeClick),
});

export function runBattleItemCommand(event) {
  return battleItemCommandEventHandlers[event.type]?.(event);
}
