// 战斗页自动化编排入口：composition root 只调用本入口。
import {
  BattleActionEventBridgeEvent,
  runBattleActionEventBridgeAutomation,
} from "./battle-action-event-bridge.js";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./new-round.js";
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

export function runBattleAutomation(event = { type: EVENT_PAGE_READY }) {
  if (event.type !== EVENT_PAGE_READY) return undefined;
  runBattlePauseControlsAutomation({ type: BattlePauseControlsEvent.INSTALL });
  runBattleActionEventBridgeAutomation({ type: BattleActionEventBridgeEvent.INSTALL });
  runBattleLifecycleAutomation({ type: BattleLifecycleEvent.BATTLE_STARTED });
  runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED });
  runBattleTurnAutomation();
}
