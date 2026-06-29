// Spirit Stance toggle command + cooldown state.
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../state/cd-tracker.js";

const EVENT_CLICK_AND_RECORD = "clickAndRecord";
const EVENT_RECORD_TOGGLE = "recordToggle";
const EVENT_READ_LAST_TOGGLE = "readLastToggle";
const DEFAULT_SPIRIT_TOGGLE_TURN = 0;

export const BattleSpiritToggleEvent = Object.freeze({
  CLICK_AND_RECORD: EVENT_CLICK_AND_RECORD,
  RECORD_TOGGLE: EVENT_RECORD_TOGGLE,
  READ_LAST_TOGGLE: EVENT_READ_LAST_TOGGLE,
});

function readGlobalTurn() {
  return runCdRuntimeAutomation({ type: CdRuntimeEvent.READ_GLOBAL_TURN });
}

function normalizeSpiritToggleTurn(value) {
  const turn = Number(value);
  return Number.isFinite(turn) && turn > 0 ? Math.trunc(turn) : DEFAULT_SPIRIT_TOGGLE_TURN;
}

function recordToggle() {
  const turn = normalizeSpiritToggleTurn(readGlobalTurn());
  g("lastSpiritToggleGlobalTurn", turn);
  return turn;
}

function readLastToggle() {
  return normalizeSpiritToggleTurn(g("lastSpiritToggleGlobalTurn"));
}

function clickAndRecord() {
  const el = gE("#ckey_spirit");
  if (!el) return false;
  el.click();
  recordToggle();
  return true;
}

export function runBattleSpiritToggleAutomation(event = { type: EVENT_READ_LAST_TOGGLE }) {
  if (event.type === EVENT_CLICK_AND_RECORD) return clickAndRecord();
  if (event.type === EVENT_RECORD_TOGGLE) return recordToggle();
  if (event.type === EVENT_READ_LAST_TOGGLE) return readLastToggle();
  return undefined;
}
