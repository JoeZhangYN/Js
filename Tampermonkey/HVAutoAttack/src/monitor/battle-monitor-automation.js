// 战斗监控编排入口：HUD、使用统计、掉落记录统一从这里进入。
import { BattleHudEvent, runBattleHudAutomation } from "./battle-info.js";
import { BattleDropEvent, runBattleDropAutomation } from "./drop-monitor.js";
import { BattleUsageEvent, runBattleUsageAutomation } from "./record-usage.js";
import { BattleReportEvent, runBattleReportAutomation } from "./battle-report.js";
import {
  BattleActionUsageCaptureEvent,
  runBattleActionUsageCapture,
} from "./battle-action-usage-capture.js";

const EVENT_COMPLETION_REACHED = "completionReached";

export const BattleMonitorEvent = Object.freeze({
  BATTLE_STARTED: BattleReportEvent.BATTLE_STARTED,
  HUD_REFRESH: BattleHudEvent.REFRESH,
  ACTION_STARTED: BattleActionUsageCaptureEvent.ACTION_STARTED,
  ACTION_ENDED: BattleActionUsageCaptureEvent.ACTION_ENDED,
  COMPLETION_REACHED: EVENT_COMPLETION_REACHED,
  CLEAR_DROP_REPORT: BattleReportEvent.CLEAR_DROP_REPORT,
  CLEAR_USAGE_REPORT: BattleReportEvent.CLEAR_USAGE_REPORT,
  RENDER_DROP_REPORT_TABLE_BODY: BattleReportEvent.RENDER_DROP_REPORT_TABLE_BODY,
  RENDER_USAGE_REPORT_TABLE_BODY: BattleReportEvent.RENDER_USAGE_REPORT_TABLE_BODY,
});

function recordActionEnd(event) {
  const usage = runBattleActionUsageCapture(event);
  if (!usage) return { kind: "skipped", reason: "usageCaptureMissing" };
  return runBattleUsageAutomation({ type: BattleUsageEvent.RECORD_ACTION_USAGE, usage });
}

function recordCompletion() {
  const drop = runBattleDropAutomation({ type: BattleDropEvent.RECORD_BATTLE_DROPS });
  const usage = runBattleUsageAutomation({ type: BattleUsageEvent.RECORD_COMPLETED_USAGE });
  return {
    kind: drop?.kind === "failed" || usage?.kind === "failed" ? "failed" : "recorded",
    drop,
    usage,
  };
}

const monitorEventHandlers = Object.freeze({
  [BattleHudEvent.REFRESH]: (event) => {
    runBattleHudAutomation(event);
  },
  [BattleActionUsageCaptureEvent.ACTION_STARTED]: (event) => {
    runBattleActionUsageCapture(event);
  },
  [BattleActionUsageCaptureEvent.ACTION_ENDED]: (event) => recordActionEnd(event),
  [EVENT_COMPLETION_REACHED]: () => recordCompletion(),
  [BattleReportEvent.BATTLE_STARTED]: (event) => runBattleReportAutomation(event),
  [BattleReportEvent.CLEAR_DROP_REPORT]: (event) => runBattleReportAutomation(event),
  [BattleReportEvent.CLEAR_USAGE_REPORT]: (event) => runBattleReportAutomation(event),
  [BattleReportEvent.RENDER_DROP_REPORT_TABLE_BODY]: (event) => runBattleReportAutomation(event),
  [BattleReportEvent.RENDER_USAGE_REPORT_TABLE_BODY]: (event) => runBattleReportAutomation(event),
});

export function runBattleMonitorAutomation(event = { type: BattleHudEvent.REFRESH }) {
  const handler = monitorEventHandlers[event?.type];
  if (!handler) return false;
  return handler(event);
}
