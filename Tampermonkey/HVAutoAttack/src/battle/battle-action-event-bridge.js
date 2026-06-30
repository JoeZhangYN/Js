// Battle action event bridge: installs eventStart/eventEnd nodes and the page API script bridge.
import { cE, gE } from "../dom/query.js";
import {
  BattleActionLifecycleEvent,
  runBattleActionLifecycleAutomation,
} from "./battle-action-lifecycle.js";
import { BattleApiBridgeEvent, runBattleApiBridgeAutomation } from "./battle-api-bridge.js";

const EVENT_INSTALL = "install";

export const BattleActionEventBridgeEvent = Object.freeze({
  INSTALL: EVENT_INSTALL,
});

function installActionEventBridge() {
  const eventStart = cE("a");
  eventStart.id = "eventStart";
  eventStart.onclick = function () {
    runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_STARTED });
  };
  gE("body").appendChild(eventStart);

  const eventEnd = cE("a");
  eventEnd.id = "eventEnd";
  eventEnd.onclick = function () {
    runBattleActionLifecycleAutomation({ type: BattleActionLifecycleEvent.ACTION_ENDED });
  };
  gE("body").appendChild(eventEnd);

  runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL });
  return true;
}

export function runBattleActionEventBridgeAutomation(event = { type: EVENT_INSTALL }) {
  if (event.type === EVENT_INSTALL) return installActionEventBridge();
  return false;
}
