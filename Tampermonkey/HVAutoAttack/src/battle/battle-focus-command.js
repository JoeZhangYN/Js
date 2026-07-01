// Focus command: one write entry for clicking the battle Focus button.
import { gE } from "../dom/query.js";
import { clickBattleCommandElement } from "./battle-command-click.js";
import { recordBattleCommandResult } from "./battle-command-recording.js";

const EVENT_CLICK = "click";

export const BattleFocusCommandEvent = Object.freeze({
  CLICK: EVENT_CLICK,
});

function clickFocus() {
  const focus = readFocusElement();
  if (focus.error) {
    recordCommandResult("rejected", "focusElementReadFailed", { error: focus.error });
    return false;
  }
  const el = focus.el;
  if (!el) {
    recordCommandResult("rejected", "focusMissing");
    return false;
  }
  const clickResult = clickBattleCommandElement(el);
  if (!clickResult.clicked) {
    recordCommandResult("rejected", clickResult.reason, { error: clickResult.error });
    return false;
  }
  recordCommandResult("accepted", "clicked");
  return true;
}

function readFocusElement() {
  try {
    return { el: gE("#ckey_focus") };
  } catch (error) {
    return { el: null, error: error?.message || String(error) };
  }
}

function recordCommandResult(result, reason, detail) {
  recordBattleCommandResult("focus.click", result, reason, detail);
}

const battleFocusCommandEventHandlers = Object.freeze({
  [EVENT_CLICK]: () => clickFocus(),
});

export function runBattleFocusCommand(event = { type: EVENT_CLICK }) {
  const handler = battleFocusCommandEventHandlers[event?.type];
  if (!handler) {
    recordCommandResult("rejected", "unknownFocusCommand", { eventType: event?.type ?? null });
    return false;
  }
  return handler(event);
}
