// 战斗监控编排入口：HUD、使用统计、掉落记录统一从这里进入。
import { g } from "../state/store.js";
import { BattleHudEvent, runBattleHudAutomation } from "./battle-info.js";
import { BattleDropEvent, runBattleDropAutomation } from "./drop-monitor.js";
import { runBattleUsageAutomation } from "./record-usage.js";
import { BattleReportEvent, runBattleReportAutomation } from "./battle-report.js";
import {
  BattleActionUsageCaptureEvent,
  runBattleActionUsageCapture,
} from "./battle-action-usage-capture.js";

const EVENT_BATTLE_STARTED = "battleStarted";
const EVENT_HUD_REFRESH = "hudRefresh";
const EVENT_ACTION_STARTED = "actionStarted";
const EVENT_ACTION_ENDED = "actionEnded";
const EVENT_COMPLETION_REACHED = "completionReached";
const EVENT_READ_DROP_REPORT = "readDropReport";
const EVENT_READ_USAGE_REPORT = "readUsageReport";
const EVENT_CLEAR_DROP_REPORT = "clearDropReport";
const EVENT_CLEAR_USAGE_REPORT = "clearUsageReport";
const EVENT_RENDER_DROP_REPORT_TABLE_BODY = "renderDropReportTableBody";
const EVENT_RENDER_USAGE_REPORT_TABLE_BODY = "renderUsageReportTableBody";

export const BattleMonitorEvent = Object.freeze({
  BATTLE_STARTED: EVENT_BATTLE_STARTED,
  HUD_REFRESH: EVENT_HUD_REFRESH,
  ACTION_STARTED: EVENT_ACTION_STARTED,
  ACTION_ENDED: EVENT_ACTION_ENDED,
  COMPLETION_REACHED: EVENT_COMPLETION_REACHED,
  READ_DROP_REPORT: EVENT_READ_DROP_REPORT,
  READ_USAGE_REPORT: EVENT_READ_USAGE_REPORT,
  CLEAR_DROP_REPORT: EVENT_CLEAR_DROP_REPORT,
  CLEAR_USAGE_REPORT: EVENT_CLEAR_USAGE_REPORT,
  RENDER_DROP_REPORT_TABLE_BODY: EVENT_RENDER_DROP_REPORT_TABLE_BODY,
  RENDER_USAGE_REPORT_TABLE_BODY: EVENT_RENDER_USAGE_REPORT_TABLE_BODY,
});

function recordActionEnd() {
  const usage = runBattleActionUsageCapture({ type: BattleActionUsageCaptureEvent.ACTION_ENDED });
  if (usage) runBattleUsageAutomation({ type: EVENT_ACTION_ENDED, usage });
}

function recordCompletion() {
  if (g("option").dropMonitor) {
    runBattleDropAutomation({ type: BattleDropEvent.COMPLETION_REACHED });
  }
  if (g("option").recordUsage) runBattleUsageAutomation({ type: EVENT_COMPLETION_REACHED });
}

function recordBattleStarted() {
  runBattleReportAutomation({ type: BattleReportEvent.BATTLE_STARTED });
}

export function runBattleMonitorAutomation(event = { type: EVENT_HUD_REFRESH }) {
  if (event.type === EVENT_BATTLE_STARTED) {
    recordBattleStarted();
  } else if (event.type === EVENT_HUD_REFRESH) {
    runBattleHudAutomation({ type: BattleHudEvent.REFRESH });
  } else if (event.type === EVENT_ACTION_STARTED) {
    runBattleActionUsageCapture({ type: BattleActionUsageCaptureEvent.ACTION_STARTED });
  } else if (event.type === EVENT_ACTION_ENDED) {
    recordActionEnd();
  } else if (event.type === EVENT_COMPLETION_REACHED) {
    recordCompletion();
  } else if (event.type === EVENT_READ_DROP_REPORT) {
    return runBattleReportAutomation({ type: BattleReportEvent.READ_DROP_REPORT });
  } else if (event.type === EVENT_READ_USAGE_REPORT) {
    return runBattleReportAutomation({ type: BattleReportEvent.READ_USAGE_REPORT });
  } else if (event.type === EVENT_RENDER_DROP_REPORT_TABLE_BODY) {
    return runBattleReportAutomation({ type: BattleReportEvent.RENDER_DROP_REPORT_TABLE_BODY });
  } else if (event.type === EVENT_RENDER_USAGE_REPORT_TABLE_BODY) {
    return runBattleReportAutomation({ type: BattleReportEvent.RENDER_USAGE_REPORT_TABLE_BODY });
  } else if (event.type === EVENT_CLEAR_DROP_REPORT) {
    runBattleReportAutomation({ type: BattleReportEvent.CLEAR_DROP_REPORT });
  } else if (event.type === EVENT_CLEAR_USAGE_REPORT) {
    runBattleReportAutomation({ type: BattleReportEvent.CLEAR_USAGE_REPORT });
  }
  return undefined;
}
