// 战斗页自动化编排入口：composition root 只调用本入口。
import {
  BattleActionEventBridgeEvent,
  runBattleActionEventBridgeAutomation,
} from "./battle-action-event-bridge.js";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./battle-round-start.js";
import { runBattleTurnAutomation } from "./main-loop.js";
import {
  BattlePauseControlsEvent,
  runBattlePauseControlsAutomation,
} from "./battle-pause-controls.js";
import { BattleLifecycleEvent, runBattleLifecycleAutomation } from "./battle-lifecycle.js";

const EVENT_PAGE_READY = "pageReady";

export const BattleEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

const PAGE_READY_STARTUP_STEPS = [
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
];

function installBattlePauseControls() {
  runBattlePauseControlsAutomation({ type: BattlePauseControlsEvent.INSTALL });
}

function installBattleActionEventBridge() {
  runBattleActionEventBridgeAutomation({ type: BattleActionEventBridgeEvent.INSTALL });
}

function reportBattleStarted() {
  runBattleLifecycleAutomation({ type: BattleLifecycleEvent.BATTLE_STARTED });
}

function startBattleRound() {
  runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED });
}

function runInitialBattleTurn() {
  runBattleTurnAutomation();
}

function runPageReadyStartup() {
  for (const step of PAGE_READY_STARTUP_STEPS) step.run();
}

export function runBattleAutomation(event = { type: EVENT_PAGE_READY }) {
  if (event.type !== EVENT_PAGE_READY) return undefined;
  runPageReadyStartup();
}
