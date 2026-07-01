// Battle flee command: one write entry for clicking Flee and scheduling the follow-up reload.
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { gE } from "../dom/query.js";
import { BattleCommandEvidenceEvent, runBattleCommandEvidence } from "./battle-command-evidence.js";

const EVENT_CLICK_AND_RELOAD = "clickAndReload";
const FLEE_BUTTON_ID = "1001";
const FLEE_RELOAD_DELAY_SEC = 3;

export const BattleFleeCommandEvent = Object.freeze({
  CLICK_AND_RELOAD: EVENT_CLICK_AND_RELOAD,
});

function clickFleeAndScheduleReload() {
  const el = gE(FLEE_BUTTON_ID);
  if (!el) {
    recordCommandResult("rejected", "fleeMissing");
    return false;
  }
  el.click();
  runNavigationAutomation({
    type: NavigationEvent.SCHEDULE_RELOAD,
    reason: NavigationReloadReason.FLEE_CONFIRMATION,
    seconds: FLEE_RELOAD_DELAY_SEC,
    detail: {
      source: "battleFleeCommand",
      command: EVENT_CLICK_AND_RELOAD,
      seconds: FLEE_RELOAD_DELAY_SEC,
    },
  });
  recordCommandResult("accepted", "clicked", { seconds: FLEE_RELOAD_DELAY_SEC });
  return true;
}

function recordCommandResult(result, reason, detail) {
  runBattleCommandEvidence({
    type: BattleCommandEvidenceEvent.RECORD_RESULT,
    command: "flee.clickAndReload",
    result,
    reason,
    detail,
  });
}

const battleFleeCommandEventHandlers = Object.freeze({
  [EVENT_CLICK_AND_RELOAD]: () => clickFleeAndScheduleReload(),
});

export function runBattleFleeCommand(event = { type: EVENT_CLICK_AND_RELOAD }) {
  return battleFleeCommandEventHandlers[event.type]?.(event);
}
