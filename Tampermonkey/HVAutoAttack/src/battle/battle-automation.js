// 战斗页自动化编排入口：composition root 只调用本入口。
import {
  BattleActionEventBridgeEvent,
  runBattleActionEventBridgeAutomation,
} from "./battle-action-event-bridge.js";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./battle-round-start.js";
import { BattleTurnWorkflowEvent, runBattleTurnAutomation } from "./main-loop.js";
import {
  BattlePauseControlsEvent,
  runBattlePauseControlsAutomation,
} from "./battle-pause-controls.js";
import { BattleLifecycleEvent, runBattleLifecycleAutomation } from "./battle-lifecycle.js";
import {
  BattleAutomationEvidenceEvent,
  runBattleAutomationEvidence,
} from "./battle-automation-evidence.js";

const EVENT_PAGE_READY = "pageReady";
const EVENT_UNKNOWN_BATTLE_AUTOMATION = "unknownBattleAutomationEvent";
const OUTCOME_REJECTED = "rejected";

export const BattleEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

const PAGE_READY_STARTUP_STEPS = Object.freeze([
  {
    capability: "pauseControls",
    run: installBattlePauseControls,
  },
  {
    capability: "actionEventBridge",
    run: installBattleActionEventBridge,
  },
  {
    capability: "battleStarted",
    run: reportBattleStarted,
  },
  {
    capability: "roundStarted",
    run: startBattleRound,
  },
  {
    capability: "initialBattleTurn",
    run: runInitialBattleTurn,
  },
]);

function installBattlePauseControls() {
  return runBattlePauseControlsAutomation({ type: BattlePauseControlsEvent.INSTALL });
}

function installBattleActionEventBridge() {
  return runBattleActionEventBridgeAutomation({ type: BattleActionEventBridgeEvent.INSTALL });
}

function reportBattleStarted() {
  return runBattleLifecycleAutomation({ type: BattleLifecycleEvent.BATTLE_STARTED });
}

function startBattleRound() {
  return runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED });
}

function runInitialBattleTurn() {
  return runBattleTurnAutomation({ type: BattleTurnWorkflowEvent.RUN_CURRENT_TURN });
}

function runPageReadyStartup(deps) {
  const steps = [];
  for (const step of PAGE_READY_STARTUP_STEPS) {
    const result = step.run();
    steps.push({ capability: step.capability, result: result === undefined ? true : Boolean(result) });
  }
  const startupSucceeded = steps.every((step) => step.result);
  deps.recordStartup(EVENT_PAGE_READY, startupSucceeded, steps);
  return startupSucceeded;
}

const battleEventHandlers = Object.freeze({
  [EVENT_PAGE_READY]: (event, deps) => runPageReadyStartup(deps),
});

function rejectUnknownBattleAutomationEvent(event, deps) {
  const result = {
    outcome: OUTCOME_REJECTED,
    reason: EVENT_UNKNOWN_BATTLE_AUTOMATION,
    eventType: event?.type ?? null,
  };
  deps.recordStartup(EVENT_UNKNOWN_BATTLE_AUTOMATION, result, [
    { capability: "routeEvent", result: false, reason: EVENT_UNKNOWN_BATTLE_AUTOMATION, eventType: result.eventType },
  ]);
  return false;
}

export function runBattleAutomation(
  event = { type: EVENT_PAGE_READY },
  deps = {
    recordStartup: (phase, result, steps) =>
      runBattleAutomationEvidence({
        type: BattleAutomationEvidenceEvent.RECORD_STARTUP,
        phase,
        result,
        steps,
      }),
  }
) {
  return battleEventHandlers[event?.type]?.(event, deps) ?? rejectUnknownBattleAutomationEvent(event, deps);
}
