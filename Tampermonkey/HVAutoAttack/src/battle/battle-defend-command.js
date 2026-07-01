// Battle defend command: one write entry for clicking the Defend battle control.
import { attemptClick } from "../dom/attempt-click.js";
import { BattleCommandEvidenceEvent, runBattleCommandEvidence } from "./battle-command-evidence.js";

const EVENT_CLICK = "click";
const DEFEND_BUTTON_SELECTOR = "#ckey_defend";

export const BattleDefendCommandEvent = Object.freeze({
  CLICK: EVENT_CLICK,
});

function clickDefend() {
  const clicked = attemptClick(DEFEND_BUTTON_SELECTOR);
  recordCommandResult(clicked ? "accepted" : "rejected", clicked ? "clicked" : "defendUnavailable");
  return clicked;
}

function recordCommandResult(result, reason, detail) {
  runBattleCommandEvidence({
    type: BattleCommandEvidenceEvent.RECORD_RESULT,
    command: "defend.click",
    result,
    reason,
    detail,
  });
}

const battleDefendCommandEventHandlers = Object.freeze({
  [EVENT_CLICK]: () => clickDefend(),
});

export function runBattleDefendCommand(event = { type: EVENT_CLICK }) {
  const handler = battleDefendCommandEventHandlers[event?.type];
  if (!handler) {
    recordCommandResult("rejected", "unknownDefendCommand", { eventType: event?.type });
    return false;
  }
  return handler(event);
}
