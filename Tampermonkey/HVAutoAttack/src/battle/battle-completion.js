// 战斗完成裁决：唯一入口 runBattleCompletionAutomation(event)。
import { AlarmEvent, runAlarmAutomation } from "../alarm/alarm.js";
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { gE } from "../dom/query.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "./battle-runtime.js";
import { BattleProgressEvent, runBattleProgressAutomation } from "./battle-progress.js";
import {
  BattleCompletionEvidenceEvent,
  runBattleCompletionEvidence,
} from "./battle-completion-evidence.js";

const EVENT_COMPLETION_REACHED = "completionReached";
const EVENT_READ_REACHED = "readReached";
const EVENT_UNKNOWN_COMPLETION = "unknownCompletionEvent";
const VICTORY_RELOAD_SECONDS = 3;

export const BattleCompletionEvent = Object.freeze({
  COMPLETION_REACHED: EVENT_COMPLETION_REACHED,
  READ_REACHED: EVENT_READ_REACHED,
});

const BattleCompletionOutcome = Object.freeze({
  DEFEAT: "defeat",
  NEXT_ROUND: "nextRound",
  VICTORY: "victory",
  ONGOING: "ongoing",
});

const battleCompletionEventHandlers = Object.freeze({
  [EVENT_COMPLETION_REACHED]: (event, deps) => handleCompletionReached(deps),
  [EVENT_READ_REACHED]: (event, deps) => deps.isCompletionReached(),
});

function readCompletionContext() {
  const progress = runBattleProgressAutomation({ type: BattleProgressEvent.READ_CONTEXT });
  return {
    monsterAlive: progress.monsterAlive,
    roundNow: progress.roundNow,
    roundAll: progress.roundAll,
  };
}

function classifyCompletion(context) {
  if (context.monsterAlive > 0) return BattleCompletionOutcome.DEFEAT;
  if (context.roundNow !== context.roundAll) return BattleCompletionOutcome.NEXT_ROUND;
  if (context.roundNow === context.roundAll) return BattleCompletionOutcome.VICTORY;
  return BattleCompletionOutcome.ONGOING;
}

function victoryReloadDetail(outcome, context) {
  return { source: "battleCompletion", outcome, context };
}

function effectOk(result) {
  if (result?.kind === "failed") return false;
  return result !== false;
}

function handleTerminalCompletion(outcome, context, deps) {
  const alarmKind = outcome === BattleCompletionOutcome.DEFEAT ? "Defeat" : "Victory";
  const effects = {
    alarm: effectOk(deps.triggerAlarm(alarmKind)),
    clearSession: effectOk(deps.clearSession()),
  };
  if (outcome === BattleCompletionOutcome.VICTORY) {
    effects.scheduleReload = effectOk(
      deps.scheduleReload(VICTORY_RELOAD_SECONDS, victoryReloadDetail(outcome, context))
    );
  }
  return effects;
}

function handleCompletionReached(deps) {
  const recordCompletion = deps.recordCompletion();
  const effects = {
    recordCompletion: effectOk(recordCompletion),
    recordCompletionResult: recordCompletion,
  };
  const context = deps.readCompletionContext();
  const outcome = classifyCompletion(context);
  if (outcome === BattleCompletionOutcome.DEFEAT || outcome === BattleCompletionOutcome.VICTORY) {
    Object.assign(effects, handleTerminalCompletion(outcome, context, deps));
  }
  deps.recordCompletionEvidence({ outcome, context, effects });
  return { outcome };
}

function rejectUnknownCompletionEvent(event, deps) {
  const result = { outcome: BattleCompletionOutcome.ONGOING };
  deps.recordCompletionEvidence({
    ...result,
    reason: EVENT_UNKNOWN_COMPLETION,
    eventType: event?.type ?? null,
  });
  return result;
}

export function runBattleCompletionAutomation(
  event = { type: EVENT_COMPLETION_REACHED },
  deps = {
    readCompletionContext,
    recordCompletion: () =>
      runBattleMonitorAutomation({ type: BattleMonitorEvent.COMPLETION_REACHED }),
    triggerAlarm: (kind) => runAlarmAutomation({ type: AlarmEvent.TRIGGER, kind }),
    clearSession: () => runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION }),
    isCompletionReached: () => !!gE("#btcp"),
    recordCompletionEvidence: (detail) =>
      runBattleCompletionEvidence({
        type: BattleCompletionEvidenceEvent.RECORD_COMPLETION,
        ...detail,
      }),
    scheduleReload: (sec, detail) =>
      runNavigationAutomation({
        type: NavigationEvent.SCHEDULE_RELOAD,
        reason: NavigationReloadReason.BATTLE_VICTORY,
        seconds: sec,
        detail,
      }),
  }
) {
  return battleCompletionEventHandlers[event?.type]?.(event, deps) ?? rejectUnknownCompletionEvent(event, deps);
}
