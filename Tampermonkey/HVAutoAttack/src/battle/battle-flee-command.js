// Battle flee command: one write entry for clicking Flee and scheduling the follow-up reload.
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { gE } from "../dom/query.js";
import { clickBattleCommandElement } from "./battle-command-click.js";
import { recordBattleCommandResult } from "./battle-command-recording.js";
import { recordBattleUtilityAdverse } from "./battle-utility-adverse.js";

const EVENT_CLICK_AND_RELOAD = "clickAndReload";
const FLEE_BUTTON_ID = "1001";
const FLEE_RELOAD_DELAY_SEC = 3;

export const BattleFleeCommandEvent = Object.freeze({
  CLICK_AND_RELOAD: EVENT_CLICK_AND_RELOAD,
});

function clickFleeAndScheduleReload() {
  const flee = readFleeElement();
  if (flee.error) {
    recordCommandResult("rejected", "fleeElementReadFailed", { error: flee.error });
    return false;
  }
  const el = flee.el;
  if (!el) {
    recordCommandResult("rejected", "fleeMissing");
    return false;
  }
  const clickResult = clickBattleCommandElement(el);
  if (!clickResult.clicked) {
    recordCommandResult("rejected", clickResult.reason, { error: clickResult.error });
    return false;
  }
  recordBattleUtilityAdverse("flee");
  const navigation = scheduleFleeReload();
  recordCommandResult("accepted", "clicked", {
    seconds: FLEE_RELOAD_DELAY_SEC,
    navigationResult: navigation.result,
    ...(navigation.error ? { navigationError: navigation.error } : {}),
  });
  return true;
}

function readFleeElement() {
  try {
    return { el: gE(FLEE_BUTTON_ID) };
  } catch (error) {
    return { el: null, error: error?.message || String(error) };
  }
}

function scheduleFleeReload() {
  try {
    const result = runNavigationAutomation({
      type: NavigationEvent.SCHEDULE_RELOAD,
      reason: NavigationReloadReason.FLEE_CONFIRMATION,
      seconds: FLEE_RELOAD_DELAY_SEC,
      detail: {
        source: "battleFleeCommand",
        command: EVENT_CLICK_AND_RELOAD,
        seconds: FLEE_RELOAD_DELAY_SEC,
      },
    });
    return { result: Boolean(result), error: undefined };
  } catch (error) {
    return { result: false, error: error?.message || String(error) };
  }
}

function recordCommandResult(result, reason, detail) {
  recordBattleCommandResult("flee.clickAndReload", result, reason, detail);
}

const battleFleeCommandEventHandlers = Object.freeze({
  [EVENT_CLICK_AND_RELOAD]: () => clickFleeAndScheduleReload(),
});

export function runBattleFleeCommand(event = { type: EVENT_CLICK_AND_RELOAD }) {
  const handler = battleFleeCommandEventHandlers[event?.type];
  if (!handler) {
    recordCommandResult("rejected", "unknownFleeCommand", { eventType: event?.type ?? null });
    return false;
  }
  return handler(event);
}
