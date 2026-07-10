import { AlarmEvent, runAlarmAutomation } from "../../alarm/alarm.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../../core/diagnostic-console.js";
import { UserFeedbackEvent, runUserFeedbackAutomation } from "../../core/lang.js";
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
 * （diagnostic warning + alarm + setValue disabled + 按钮文案 + document.title）。
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
  if (!pauseResult) return blockCriticalPauseFailure(plan, warning, alarm);
  document.title = `hvAA 暂停: ${plan.name} 即将消失但 MP 不足`;
  return true;
}

function blockCriticalPauseFailure(plan, warning, alarm) {
  try {
    runUserFeedbackAutomation({
      type: UserFeedbackEvent.BLOCKING_ERROR,
      incident: `critical-buff-pause:${plan.name}`,
      copy: {
        l0: "关键增益即将消失，但自动暂停失败。请复制诊断信息后反馈。",
        l1: "關鍵增益即將消失，但自動暫停失敗。請複製診斷資訊後回報。",
        l2: "A critical buff is expiring, but automatic pause failed. Copy the report for support.",
      },
      evidence: {
        capability: "criticalBuffPause",
        stage: "pauseExecution",
        reason: "criticalPauseFailed",
        plan,
        warning,
        alarm,
      },
    });
  } catch {
    // The pause evidence was persisted before this best-effort blocking prompt.
  }
  return false;
}

function warnCriticalPause(plan) {
  const warningOk = runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: [
      `[critical-buff-guard] "${plan.name}" 剩 ${plan.turns} 回合 + MP ${plan.mp.toFixed(0)}% < ${plan.mpFloor}% → 暂停脚本，请手动接管`,
    ],
  });
  if (warningOk) return { warningOk: true };
  return {
    warningOk: false,
    warningError: "diagnostic console blocked",
  };
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
