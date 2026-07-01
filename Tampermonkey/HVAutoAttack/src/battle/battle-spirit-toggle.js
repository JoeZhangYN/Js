// Spirit Stance toggle command + cooldown state.
import { gE, isSpiritActive } from "../dom/query.js";
import { g } from "../state/store.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../state/cd-tracker.js";
import { BattleCommandEvidenceEvent, runBattleCommandEvidence } from "./battle-command-evidence.js";

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

const battleSpiritToggleEventHandlers = Object.freeze({
  [EVENT_CLICK_AND_RECORD]: () => clickAndRecord(),
  [EVENT_ACTIVATE_IF_INACTIVE]: () => activateIfInactive(),
  [EVENT_RECORD_TOGGLE]: () => recordToggle(),
  [EVENT_READ_LAST_TOGGLE]: () => readLastToggle(),
  [EVENT_READ_ACTIVE]: () => readActive(),
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
  if (!el) {
    recordCommandResult("spirit.clickAndRecord", "rejected", "spiritMissing");
    return false;
  }
  el.click();
  const turn = recordToggle();
  recordCommandResult("spirit.clickAndRecord", "accepted", "clicked", { turn });
  return true;
}

function activateIfInactive() {
  const el = gE("#ckey_spirit");
  if (!el) {
    recordCommandResult("spirit.activateIfInactive", "rejected", "spiritMissing");
    return false;
  }
  if (isSpiritActive(el)) {
    recordCommandResult("spirit.activateIfInactive", "rejected", "alreadyActive");
    return false;
  }
  el.click();
  const turn = recordToggle();
  recordCommandResult("spirit.activateIfInactive", "accepted", "clicked", { turn });
  return true;
}

function recordCommandResult(command, result, reason, detail) {
  runBattleCommandEvidence({
    type: BattleCommandEvidenceEvent.RECORD_RESULT,
    command,
    result,
    reason,
    detail,
  });
}

export function runBattleSpiritToggleAutomation(event = { type: EVENT_READ_LAST_TOGGLE }) {
  const handler = battleSpiritToggleEventHandlers[event.type];
  if (!handler) {
    recordCommandResult("spirit.unknown", "rejected", "unknownSpiritToggleEvent", {
      eventType: event?.type,
    });
    return false;
  }
  return handler(event);
}
