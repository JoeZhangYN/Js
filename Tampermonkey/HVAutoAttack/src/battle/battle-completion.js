// 战斗完成裁决：唯一入口 runBattleCompletionAutomation(event)。
import { AlarmEvent, runAlarmAutomation } from "../alarm/alarm.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "./battle-runtime.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

const EVENT_COMPLETION_REACHED = "completionReached";
const VICTORY_RELOAD_SECONDS = 3;

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

function handleTerminalCompletion(outcome, deps) {
  const alarmKind = outcome === BattleCompletionOutcome.DEFEAT ? "Defeat" : "Victory";
  deps.triggerAlarm(alarmKind);
  deps.clearSession();
  if (outcome === BattleCompletionOutcome.VICTORY) {
    deps.scheduleReload(VICTORY_RELOAD_SECONDS);
  }
}

function handleCompletionReached(deps) {
  const outcome = classifyCompletion(deps.readCompletionContext());
  if (outcome === BattleCompletionOutcome.DEFEAT || outcome === BattleCompletionOutcome.VICTORY) {
    handleTerminalCompletion(outcome, deps);
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
