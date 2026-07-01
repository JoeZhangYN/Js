// Focus command: one write entry for clicking the battle Focus button.
import { gE } from "../dom/query.js";
import { BattleCommandEvidenceEvent, runBattleCommandEvidence } from "./battle-command-evidence.js";

const EVENT_CLICK = "click";

export const BattleFocusCommandEvent = Object.freeze({
  CLICK: EVENT_CLICK,
});

function clickFocus() {
  const el = gE("#ckey_focus");
  if (!el) {
    recordCommandResult("rejected", "focusMissing");
    return false;
  }
  el.click();
  recordCommandResult("accepted", "clicked");
  return true;
}

function recordCommandResult(result, reason) {
  runBattleCommandEvidence({
    type: BattleCommandEvidenceEvent.RECORD_RESULT,
    command: "focus.click",
    result,
    reason,
  });
}

const battleFocusCommandEventHandlers = Object.freeze({
  [EVENT_CLICK]: () => clickFocus(),
});

export function runBattleFocusCommand(event = { type: EVENT_CLICK }) {
  return battleFocusCommandEventHandlers[event.type]?.(event);
}
