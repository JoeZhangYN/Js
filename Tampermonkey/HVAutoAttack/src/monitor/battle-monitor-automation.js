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
  if (usage) runBattleUsageAutomation({ type: BattleUsageEvent.RECORD_ACTION_USAGE, usage });
}

function recordCompletion() {
  runBattleDropAutomation({ type: BattleDropEvent.COMPLETION_REACHED });
  runBattleUsageAutomation({ type: BattleUsageEvent.RECORD_COMPLETED_USAGE });
}

function routeBattleReportCommand(event) {
  if (!Object.values(BattleReportEvent).includes(event.type)) return undefined;
  return runBattleReportAutomation(event);
}

export function runBattleMonitorAutomation(event = { type: BattleHudEvent.REFRESH }) {
  if (event.type === BattleHudEvent.REFRESH) {
    runBattleHudAutomation(event);
  } else if (event.type === BattleActionUsageCaptureEvent.ACTION_STARTED) {
    runBattleActionUsageCapture(event);
  } else if (event.type === BattleActionUsageCaptureEvent.ACTION_ENDED) {
    recordActionEnd(event);
  } else if (event.type === EVENT_COMPLETION_REACHED) {
    recordCompletion();
  } else {
    return routeBattleReportCommand(event);
  }
  return undefined;
}
