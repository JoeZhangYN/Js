// Battle defend command: one write entry for clicking the Defend battle control.
import { attemptClick } from "../dom/attempt-click.js";

const EVENT_CLICK = "click";
const DEFEND_BUTTON_SELECTOR = "#ckey_defend";

export const BattleDefendCommandEvent = Object.freeze({
  CLICK: EVENT_CLICK,
});

function clickDefend() {
  return attemptClick(DEFEND_BUTTON_SELECTOR);
}

const battleDefendCommandEventHandlers = Object.freeze({
  [EVENT_CLICK]: () => clickDefend(),
});

export function runBattleDefendCommand(event = { type: EVENT_CLICK }) {
  return battleDefendCommandEventHandlers[event.type]?.(event);
}
