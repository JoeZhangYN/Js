import { AlarmEvent, runAlarmAutomation } from "../../alarm/alarm.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "../pause-automation.js";

const EVENT_APPLY_PLAN = "applyPlan";

export const CriticalBuffPauseExecutionEvent = Object.freeze({
  APPLY_PLAN: EVENT_APPLY_PLAN,
});

/**
 * SHELL：忠实复刻原 checkCriticalBuffGuard 命中分支的 5 件副作用
 * （console.warn + alarm + setValue disabled + 按钮文案 + document.title）。
 * @param {{ name:string, turns:number, mp:number, mpFloor:number }} plan
 */
function executeCriticalPause(plan) {
  console.warn(
    `[critical-buff-guard] "${plan.name}" 剩 ${plan.turns} 回合 + MP ${plan.mp.toFixed(0)}% < ${plan.mpFloor}% → 暂停脚本，请手动接管`
  );
  runAlarmAutomation({ type: AlarmEvent.TRIGGER, kind: "Error" });
  runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE });
  document.title = `hvAA 暂停: ${plan.name} 即将消失但 MP 不足`;
}

export function runCriticalBuffPauseExecution(event = { type: EVENT_APPLY_PLAN }) {
  if (event.type === EVENT_APPLY_PLAN) {
    executeCriticalPause(event.plan);
    return true;
  }
  return false;
}
