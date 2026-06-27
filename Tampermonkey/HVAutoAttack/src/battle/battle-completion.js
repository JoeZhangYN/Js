// 战斗完成裁决：唯一入口 runBattleCompletionAutomation(event)。
import { setAlarm } from "../alarm/alarm.js";
import { scheduleReload } from "../core/navigate.js";
import { g } from "../state/store.js";
import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "./battle-runtime.js";

const EVENT_COMPLETION_REACHED = "completionReached";

export const BattleCompletionEvent = Object.freeze({
  COMPLETION_REACHED: EVENT_COMPLETION_REACHED,
});

export const BattleCompletionOutcome = Object.freeze({
  DEFEAT: "defeat",
  NEXT_ROUND: "nextRound",
  VICTORY: "victory",
  ONGOING: "ongoing",
});

function classifyCompletion() {
  if (g("monsterAlive") > 0) return BattleCompletionOutcome.DEFEAT;
  if (g("roundNow") !== g("roundAll")) return BattleCompletionOutcome.NEXT_ROUND;
  if (g("roundNow") === g("roundAll")) return BattleCompletionOutcome.VICTORY;
  return BattleCompletionOutcome.ONGOING;
}

function handleCompletionReached(deps) {
  const outcome = classifyCompletion();
  if (outcome === BattleCompletionOutcome.DEFEAT) {
    deps.setAlarm("Defeat");
    deps.clearSession();
  } else if (outcome === BattleCompletionOutcome.VICTORY) {
    deps.setAlarm("Victory");
    deps.clearSession();
    deps.scheduleReload(3);
  }
  return { outcome };
}

export function runBattleCompletionAutomation(
  event = { type: EVENT_COMPLETION_REACHED },
  deps = {
    setAlarm,
    clearSession: () => runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION }),
    scheduleReload,
  }
) {
  if (event.type === EVENT_COMPLETION_REACHED) return handleCompletionReached(deps);
  return { outcome: BattleCompletionOutcome.ONGOING };
}
