// Current battle turn lifecycle: reset at round start, advance at turn start, read for observers.
import { g } from "./store.js";

const EVENT_ROUND_STARTED = "roundStarted";
const EVENT_TURN_STARTED = "turnStarted";
const EVENT_READ_CURRENT = "readCurrent";

export const BattleTurnEvent = Object.freeze({
  ROUND_STARTED: EVENT_ROUND_STARTED,
  TURN_STARTED: EVENT_TURN_STARTED,
  READ_CURRENT: EVENT_READ_CURRENT,
});

function resetTurn() {
  g("turn", 0);
  return 0;
}

function advanceTurn() {
  const turn = (g("turn") || 0) + 1;
  g("turn", turn);
  return turn;
}

function readCurrentTurn() {
  return g("turn") || 0;
}

export function runBattleTurnAutomation(event = { type: EVENT_READ_CURRENT }) {
  if (event.type === EVENT_ROUND_STARTED) return resetTurn();
  if (event.type === EVENT_TURN_STARTED) return advanceTurn();
  if (event.type === EVENT_READ_CURRENT) return readCurrentTurn();
  return undefined;
}
