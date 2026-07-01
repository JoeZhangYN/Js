// Battle action event bridge: installs eventStart/eventEnd nodes and the page API script bridge.
import { cE, gE } from "../dom/query.js";
import {
  BattleActionLifecycleEvent,
  runBattleActionLifecycleAutomation,
} from "./battle-action-lifecycle.js";
import {
  BattleActionLifecycleEvidenceEvent,
  runBattleActionLifecycleEvidence,
} from "./battle-action-lifecycle-evidence.js";
import { BattleApiBridgeEvent, runBattleApiBridgeAutomation } from "./battle-api-bridge.js";

const EVENT_INSTALL = "install";
const EVENT_UNKNOWN_ACTION_EVENT_BRIDGE = "unknownActionEventBridgeEvent";

export const BattleActionEventBridgeEvent = Object.freeze({
  INSTALL: EVENT_INSTALL,
});

const battleActionEventBridgeEventHandlers = Object.freeze({
  [EVENT_INSTALL]: () => installActionEventBridge(),
});

function rejectUnknownActionEventBridgeEvent(event) {
  const result = {
    outcome: "rejected",
    reason: EVENT_UNKNOWN_ACTION_EVENT_BRIDGE,
    eventType: event?.type ?? null,
  };
  runBattleActionLifecycleEvidence({
    type: BattleActionLifecycleEvidenceEvent.RECORD_LIFECYCLE,
    phase: EVENT_UNKNOWN_ACTION_EVENT_BRIDGE,
    result,
    steps: [
      {
        step: "routeEvent",
        result: false,
        reason: EVENT_UNKNOWN_ACTION_EVENT_BRIDGE,
        eventType: result.eventType,
      },
    ],
  });
  return false;
}

function installActionEventBridge() {
  const eventStart = cE("a");
  eventStart.id = "eventStart";
  eventStart.onclick = function () {
    runLifecycleFromBridge("eventStart", BattleActionLifecycleEvent.ACTION_STARTED);
  };
  gE("body").appendChild(eventStart);

  const eventEnd = cE("a");
  eventEnd.id = "eventEnd";
  eventEnd.onclick = function () {
    runLifecycleFromBridge("eventEnd", BattleActionLifecycleEvent.ACTION_ENDED);
  };
  gE("body").appendChild(eventEnd);

  return Boolean(runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL }));
}

function runLifecycleFromBridge(nodeId, eventType) {
  try {
    return runBattleActionLifecycleAutomation({ type: eventType });
  } catch (error) {
    runBattleActionLifecycleEvidence({
      type: BattleActionLifecycleEvidenceEvent.RECORD_LIFECYCLE,
      phase: EVENT_UNKNOWN_ACTION_EVENT_BRIDGE,
      result: {
        outcome: "rejected",
        reason: "actionLifecycleBridgeThrew",
        eventType,
        nodeId,
        error: error?.message || String(error),
      },
      steps: [{ step: "runLifecycleFromBridge", result: false, nodeId, eventType }],
    });
    return false;
  }
}

export function runBattleActionEventBridgeAutomation(event = { type: EVENT_INSTALL }) {
  return battleActionEventBridgeEventHandlers[event?.type]?.(event) ?? rejectUnknownActionEventBridgeEvent(event);
}
