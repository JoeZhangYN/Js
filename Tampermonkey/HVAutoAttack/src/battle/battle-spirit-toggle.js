// Spirit Stance toggle command + cooldown state.
import { gE, isSpiritActive } from "../dom/query.js";
import { g } from "../state/store.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../state/cd-tracker.js";

const EVENT_CLICK_AND_RECORD = "clickAndRecord";
const EVENT_ACTIVATE_IF_INACTIVE = "activateIfInactive";
const EVENT_RECORD_TOGGLE = "recordToggle";
const EVENT_READ_LAST_TOGGLE = "readLastToggle";
const EVENT_READ_ACTIVE = "readActive";
const DEFAULT_SPIRIT_TOGGLE_TURN = 0;

export const BattleSpiritToggleEvent = Object.freeze({
  CLICK_AND_RECORD: EVENT_CLICK_AND_RECORD,
  ACTIVATE_IF_INACTIVE: EVENT_ACTIVATE_IF_INACTIVE,
  RECORD_TOGGLE: EVENT_RECORD_TOGGLE,
  READ_LAST_TOGGLE: EVENT_READ_LAST_TOGGLE,
  READ_ACTIVE: EVENT_READ_ACTIVE,
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

function readActive() {
  return isSpiritActive(gE("#ckey_spirit"));
}

function clickAndRecord() {
  const el = gE("#ckey_spirit");
  if (!el) return false;
  el.click();
  recordToggle();
  return true;
}

function activateIfInactive() {
  const el = gE("#ckey_spirit");
  if (!el || isSpiritActive(el)) return false;
  el.click();
  recordToggle();
  return true;
}

export function runBattleSpiritToggleAutomation(event = { type: EVENT_READ_LAST_TOGGLE }) {
  if (event.type === EVENT_CLICK_AND_RECORD) return clickAndRecord();
  if (event.type === EVENT_ACTIVATE_IF_INACTIVE) return activateIfInactive();
  if (event.type === EVENT_RECORD_TOGGLE) return recordToggle();
  if (event.type === EVENT_READ_LAST_TOGGLE) return readLastToggle();
  if (event.type === EVENT_READ_ACTIVE) return readActive();
  return undefined;
}
