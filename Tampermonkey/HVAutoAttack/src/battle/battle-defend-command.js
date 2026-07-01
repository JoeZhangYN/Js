// Battle defend command: one write entry for clicking the Defend battle control.
import { gE, isOn } from "../dom/query.js";
import { clickBattleCommandElement } from "./battle-command-click.js";
import { recordBattleCommandResult } from "./battle-command-recording.js";

const EVENT_CLICK = "click";
const DEFEND_BUTTON_SELECTOR = "#ckey_defend";

export const BattleDefendCommandEvent = Object.freeze({
  CLICK: EVENT_CLICK,
});

function clickDefend() {
  if (!isOn(DEFEND_BUTTON_SELECTOR)) {
    recordCommandResult("rejected", "defendUnavailable");
    return false;
  }
  const el = gE(DEFEND_BUTTON_SELECTOR);
  if (!el) {
    recordCommandResult("rejected", "defendUnavailable");
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

function recordCommandResult(result, reason, detail) {
  recordBattleCommandResult("defend.click", result, reason, detail);
}

const battleDefendCommandEventHandlers = Object.freeze({
  [EVENT_CLICK]: () => clickDefend(),
});

export function runBattleDefendCommand(event = { type: EVENT_CLICK }) {
  const handler = battleDefendCommandEventHandlers[event?.type];
  if (!handler) {
    recordCommandResult("rejected", "unknownDefendCommand", { eventType: event?.type ?? null });
    return false;
  }
  return handler(event);
}
