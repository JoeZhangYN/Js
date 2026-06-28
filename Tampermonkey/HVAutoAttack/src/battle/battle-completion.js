// 战斗完成裁决：唯一入口 runBattleCompletionAutomation(event)。
import { AlarmEvent, runAlarmAutomation } from "../alarm/alarm.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "./battle-runtime.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

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

function readCompletionContext() {
  const combatants = runMonsterStatusAutomation({
    type: MonsterStatusEvent.READ_COMBATANT_COUNTS,
  });
  const round = runBattleRoundAutomation({ type: BattleRoundEvent.READ_RUNTIME });
  return {
    monsterAlive: combatants.monsterAlive,
    roundNow: round.roundNow,
    roundAll: round.roundAll,
  };
}

function classifyCompletion(context) {
  if (context.monsterAlive > 0) return BattleCompletionOutcome.DEFEAT;
  if (context.roundNow !== context.roundAll) return BattleCompletionOutcome.NEXT_ROUND;
  if (context.roundNow === context.roundAll) return BattleCompletionOutcome.VICTORY;
  return BattleCompletionOutcome.ONGOING;
}

function handleCompletionReached(deps) {
  const outcome = classifyCompletion(deps.readCompletionContext());
  if (outcome === BattleCompletionOutcome.DEFEAT) {
    deps.triggerAlarm("Defeat");
    deps.clearSession();
  } else if (outcome === BattleCompletionOutcome.VICTORY) {
    deps.triggerAlarm("Victory");
    deps.clearSession();
    deps.scheduleReload(3);
  }
  return { outcome };
}

export function runBattleCompletionAutomation(
  event = { type: EVENT_COMPLETION_REACHED },
  deps = {
    readCompletionContext,
    triggerAlarm: (kind) => runAlarmAutomation({ type: AlarmEvent.TRIGGER, kind }),
    clearSession: () => runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION }),
    scheduleReload: (sec) =>
      runNavigationAutomation({
        type: NavigationEvent.SCHEDULE_RELOAD,
        seconds: sec,
      }),
  }
) {
  if (event.type === EVENT_COMPLETION_REACHED) return handleCompletionReached(deps);
  return { outcome: BattleCompletionOutcome.ONGOING };
}
