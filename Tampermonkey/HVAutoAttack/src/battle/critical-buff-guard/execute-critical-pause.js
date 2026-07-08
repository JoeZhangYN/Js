import { AlarmEvent, runAlarmAutomation } from "../../alarm/alarm.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "../pause-automation.js";
import { BattlePauseEvidenceEvent, runBattlePauseEvidence } from "../battle-pause-evidence.js";

const EVENT_APPLY_PLAN = "applyPlan";
const REASON_INVALID_PLAN = "invalidCriticalBuffPausePlan";
const REASON_UNKNOWN_EVENT = "unknownCriticalPauseExecutionEvent";

export const CriticalBuffPauseExecutionEvent = Object.freeze({
  APPLY_PLAN: EVENT_APPLY_PLAN,
});

const criticalBuffPauseExecutionEventHandlers = Object.freeze({
  [EVENT_APPLY_PLAN]: (event) => executeCriticalPause(event.plan),
});

/**
 * SHELL：忠实复刻原 checkCriticalBuffGuard 命中分支的 5 件副作用
 * （console.warn + alarm + setValue disabled + 按钮文案 + document.title）。
 * @param {{ name:string, turns:number, mp:number, mpFloor:number }} plan
 */
function executeCriticalPause(plan) {
  if (!isCriticalPausePlan(plan)) return rejectCriticalPausePlan(plan);
  const warning = warnCriticalPause(plan);
  const alarm = triggerCriticalAlarm();
  const pauseResult = runBattlePauseAutomation({
    type: BattlePauseEvent.PAUSE,
    reason: "criticalBuff",
    detail: { ...plan, ...warning, ...alarm },
  });
  document.title = `hvAA 暂停: ${plan.name} 即将消失但 MP 不足`;
  return Boolean(pauseResult);
}

function warnCriticalPause(plan) {
  try {
    console.warn(
      `[critical-buff-guard] "${plan.name}" 剩 ${plan.turns} 回合 + MP ${plan.mp.toFixed(0)}% < ${plan.mpFloor}% → 暂停脚本，请手动接管`
    );
    return { warningOk: true };
  } catch (error) {
    return { warningOk: false, warningError: error?.message || String(error) };
  }
}

function triggerCriticalAlarm() {
  try {
    return {
      alarmResult: criticalAlarmTriggered(
        runAlarmAutomation({ type: AlarmEvent.TRIGGER, kind: "Error" })
      ),
    };
  } catch (error) {
    return { alarmResult: false, alarmError: error?.message || String(error) };
  }
}

function criticalAlarmTriggered(result) {
  if (result && typeof result === "object" && result.kind === "failed") return false;
  return Boolean(result);
}

function isCriticalPausePlan(plan) {
  return (
    plan &&
    typeof plan.name === "string" &&
    Number.isFinite(plan.turns) &&
    Number.isFinite(plan.mp) &&
    Number.isFinite(plan.mpFloor)
  );
}

function rejectCriticalPausePlan(plan) {
  runBattlePauseEvidence({
    type: BattlePauseEvidenceEvent.RECORD_STATE,
    state: "rejected",
    reason: REASON_INVALID_PLAN,
    detail: { plan },
  });
  return false;
}

function rejectUnknownCriticalPauseEvent(event) {
  runBattlePauseEvidence({
    type: BattlePauseEvidenceEvent.RECORD_STATE,
    state: "rejected",
    reason: REASON_UNKNOWN_EVENT,
    detail: { eventType: event?.type ?? null },
  });
  return false;
}

export function runCriticalBuffPauseExecution(event = { type: EVENT_APPLY_PLAN }) {
  return (
    criticalBuffPauseExecutionEventHandlers[event?.type]?.(event) ??
    rejectUnknownCriticalPauseEvent(event)
  );
}
