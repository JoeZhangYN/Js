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
  const readiness = readDefendReadiness();
  if (readiness.error) {
    recordCommandResult("rejected", "defendReadinessReadFailed", { error: readiness.error });
    return false;
  }
  if (!readiness.ready) {
    recordCommandResult("rejected", "defendUnavailable");
    return false;
  }
  const defend = readDefendElement();
  if (defend.error) {
    recordCommandResult("rejected", "defendElementReadFailed", { error: defend.error });
    return false;
  }
  const el = defend.el;
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

function readDefendReadiness() {
  try {
    return { ready: Boolean(isOn(DEFEND_BUTTON_SELECTOR)) };
  } catch (error) {
    return { ready: false, error: error?.message || String(error) };
  }
}

function readDefendElement() {
  try {
    return { el: gE(DEFEND_BUTTON_SELECTOR) };
  } catch (error) {
    return { el: null, error: error?.message || String(error) };
  }
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
