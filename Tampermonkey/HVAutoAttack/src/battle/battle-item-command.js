// Battle item command: one write entry for gem and inventory item button clicks.
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
  el.click();
  return true;
}

function clickItem(itemId, beforeClick) {
  const el = gE(itemSelector(itemId));
  if (!el) return false;
  beforeClick?.();
  el.click();
  return true;
}

export function runBattleItemCommand(event) {
  if (event.type === EVENT_CLICK_GEM) return clickGem();
  if (event.type === EVENT_CLICK_ITEM) return clickItem(event.itemId, event.beforeClick);
  return undefined;
}
