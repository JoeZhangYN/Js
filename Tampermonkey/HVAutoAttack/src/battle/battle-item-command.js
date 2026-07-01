// Battle item command: one write entry for gem and inventory item button clicks.
import { gE } from "../dom/query.js";
import { itemSelector } from "../dom/selectors.js";
import { clickBattleCommandElement } from "./battle-command-click.js";
import { recordBattleCommandResult } from "./battle-command-recording.js";

const EVENT_CLICK_GEM = "clickGem";
const EVENT_CLICK_ITEM = "clickItem";

export const BattleItemCommandEvent = Object.freeze({
  CLICK_GEM: EVENT_CLICK_GEM,
  CLICK_ITEM: EVENT_CLICK_ITEM,
});

function recordCommandResult(command, result, reason, detail) {
  recordBattleCommandResult(command, result, reason, detail);
}

function clickGem() {
  const el = gE("#ikey_p");
  if (!el) {
    recordCommandResult("item.clickGem", "rejected", "gemMissing");
    return false;
  }
  const clickResult = clickBattleCommandElement(el);
  if (!clickResult.clicked) {
    recordCommandResult("item.clickGem", "rejected", clickResult.reason, {
      error: clickResult.error,
    });
    return false;
  }
  recordCommandResult("item.clickGem", "accepted", "clicked");
  return true;
}

function clickItem(itemId, beforeClick) {
  const el = gE(itemSelector(itemId));
  if (!el) {
    recordCommandResult("item.clickItem", "rejected", "itemMissing", { itemId });
    return false;
  }
  try {
    beforeClick?.();
  } catch (error) {
    recordCommandResult("item.clickItem", "rejected", "beforeClickFailed", {
      itemId,
      error: error?.message || String(error),
    });
    return false;
  }
  const clickResult = clickBattleCommandElement(el);
  if (!clickResult.clicked) {
    recordCommandResult("item.clickItem", "rejected", clickResult.reason, {
      itemId,
      error: clickResult.error,
    });
    return false;
  }
  recordCommandResult("item.clickItem", "accepted", "clicked", { itemId });
  return true;
}

const battleItemCommandEventHandlers = Object.freeze({
  [EVENT_CLICK_GEM]: () => clickGem(),
  [EVENT_CLICK_ITEM]: (event) => clickItem(event.itemId, event.beforeClick),
});

export function runBattleItemCommand(event) {
  const handler = battleItemCommandEventHandlers[event?.type];
  if (!handler) {
    recordCommandResult("item.unknown", "rejected", "unknownItemCommand", {
      eventType: event?.type ?? null,
    });
    return false;
  }
  return handler(event);
}
