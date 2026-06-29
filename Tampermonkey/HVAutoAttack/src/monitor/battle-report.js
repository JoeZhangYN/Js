import { TimeEvent, runTimeAutomation } from "../core/time.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { readDropReportModel, readUsageReportModel } from "./battle-report-model.js";
import { BattleReportViewEvent, runBattleReportViewAutomation } from "./battle-report-view.js";
import { BattleMonitorRuntimeEvent, runBattleMonitorRuntime } from "./battle-monitor-runtime.js";

export const BattleReportEvent = Object.freeze({
  BATTLE_STARTED: "battleStarted",
  CLEAR_DROP_REPORT: "clearDropReport",
  CLEAR_USAGE_REPORT: "clearUsageReport",
  RENDER_DROP_REPORT_TABLE_BODY: "renderDropReportTableBody",
  RENDER_USAGE_REPORT_TABLE_BODY: "renderUsageReportTableBody",
});

function readBattleReportRecordLabel(deps) {
  return (
    deps.readRecordLabel || (() => runTimeAutomation({ type: TimeEvent.UTC_MONTH_DAY_LABEL }))
  )();
}

function readBattleReportStartContext(deps) {
  return (
    deps.readStartContext ||
    (() => runBattleMonitorRuntime({ type: BattleMonitorRuntimeEvent.REPORT_START_CONTEXT }))
  )();
}

function recordBattleReportStarted(deps) {
  const { recordEach, roundType, roundAll } = readBattleReportStartContext(deps);
  const recordLabel = readBattleReportRecordLabel(deps);
  return runBattleRecordArchiveAutomation({
    type: BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING,
    enabled: recordEach,
    code: `${recordLabel}: ${roundType.toUpperCase()}-${roundAll}`,
  });
}

function clearReport(type) {
  runBattleRecordArchiveAutomation({
    type,
  });
}

function renderReportTableBody(type, report) {
  return runBattleReportViewAutomation({ type, report });
}

export function runBattleReportAutomation(event, deps = {}) {
  if (event.type === BattleReportEvent.BATTLE_STARTED) {
    return recordBattleReportStarted(deps);
  }
  if (event.type === BattleReportEvent.RENDER_DROP_REPORT_TABLE_BODY) {
    return renderReportTableBody(
      BattleReportViewEvent.RENDER_DROP_TABLE_BODY,
      readDropReportModel()
    );
  }
  if (event.type === BattleReportEvent.RENDER_USAGE_REPORT_TABLE_BODY) {
    return renderReportTableBody(
      BattleReportViewEvent.RENDER_USAGE_TABLE_BODY,
      readUsageReportModel()
    );
  }
  if (event.type === BattleReportEvent.CLEAR_DROP_REPORT) {
    clearReport(BattleRecordArchiveEvent.CLEAR_DROP_REPORT);
    return undefined;
  }
  if (event.type === BattleReportEvent.CLEAR_USAGE_REPORT) {
    clearReport(BattleRecordArchiveEvent.CLEAR_USAGE_REPORT);
    return undefined;
  }
  return undefined;
}
