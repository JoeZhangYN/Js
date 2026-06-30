import { BattleProgressEvent, runBattleProgressAutomation } from "./battle-progress.js";
import {
  BattleStartRuntimeEvent,
  runBattleStartRuntimeAutomation,
} from "./battle-start-runtime.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "./battle-spirit-toggle.js";

const EVENT_READ_CURRENT = "readCurrent";

export const BattleDecisionRuntimeEvent = Object.freeze({
  READ_CURRENT: EVENT_READ_CURRENT,
});

function readCurrentDecisionRuntime() {
  const progress = runBattleProgressAutomation({ type: BattleProgressEvent.READ_CONTEXT });
  return {
    monsterAlive: progress.monsterAlive,
    roundAll: progress.roundAll,
    roundNow: progress.roundNow,
    roundType: progress.roundType,
    attackStatus: runBattleStartRuntimeAutomation({
      type: BattleStartRuntimeEvent.READ_ATTACK_STATUS,
    }),
    lastSpiritToggleGlobalTurn: runBattleSpiritToggleAutomation({
      type: BattleSpiritToggleEvent.READ_LAST_TOGGLE,
    }),
  };
}

export function runBattleDecisionRuntime(event = { type: EVENT_READ_CURRENT }) {
  if (event.type === EVENT_READ_CURRENT) return readCurrentDecisionRuntime();
  return {};
}
