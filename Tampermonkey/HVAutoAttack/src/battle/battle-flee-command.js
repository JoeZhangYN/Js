// Battle flee command: one write entry for clicking Flee and scheduling the follow-up reload.
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { gE } from "../dom/query.js";

const EVENT_CLICK_AND_RELOAD = "clickAndReload";
const FLEE_BUTTON_ID = "1001";
const FLEE_RELOAD_DELAY_SEC = 3;

export const BattleFleeCommandEvent = Object.freeze({
  CLICK_AND_RELOAD: EVENT_CLICK_AND_RELOAD,
});

function clickFleeAndScheduleReload() {
  const el = gE(FLEE_BUTTON_ID);
  if (!el) return false;
  el.click();
  runNavigationAutomation({
    type: NavigationEvent.SCHEDULE_RELOAD,
    seconds: FLEE_RELOAD_DELAY_SEC,
  });
  return true;
}

export function runBattleFleeCommand(event = { type: EVENT_CLICK_AND_RELOAD }) {
  if (event.type === EVENT_CLICK_AND_RELOAD) return clickFleeAndScheduleReload();
  return undefined;
}
