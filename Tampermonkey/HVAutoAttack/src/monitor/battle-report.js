import { TimeEvent, runTimeAutomation } from "../core/time.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { BattleReportModelEvent, runBattleReportModel } from "./battle-report-model.js";
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

function normalizeBattleReportRoundType(roundType) {
  return typeof roundType === "string" && roundType.trim() ? roundType.toUpperCase() : "UNKNOWN";
}

function normalizeBattleReportRoundAll(roundAll) {
  return roundAll == null || roundAll === "" ? "?" : roundAll;
}

function recordBattleReportStarted(deps) {
  const { recordEach, roundType, roundAll } = readBattleReportStartContext(deps);
  const recordLabel = readBattleReportRecordLabel(deps);
  return runBattleRecordArchiveAutomation({
    type: BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING,
    enabled: recordEach,
    code: `${recordLabel}: ${normalizeBattleReportRoundType(roundType)}-${normalizeBattleReportRoundAll(roundAll)}`,
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

const reportEventHandlers = Object.freeze({
  [BattleReportEvent.BATTLE_STARTED]: (_event, deps) => recordBattleReportStarted(deps),
  [BattleReportEvent.RENDER_DROP_REPORT_TABLE_BODY]: () =>
    renderReportTableBody(
      BattleReportViewEvent.RENDER_DROP_TABLE_BODY,
      runBattleReportModel({ type: BattleReportModelEvent.READ_DROP_REPORT_MODEL })
    ),
  [BattleReportEvent.RENDER_USAGE_REPORT_TABLE_BODY]: () =>
    renderReportTableBody(
      BattleReportViewEvent.RENDER_USAGE_TABLE_BODY,
      runBattleReportModel({ type: BattleReportModelEvent.READ_USAGE_REPORT_MODEL })
    ),
  [BattleReportEvent.CLEAR_DROP_REPORT]: () =>
    clearReport(BattleRecordArchiveEvent.CLEAR_DROP_REPORT),
  [BattleReportEvent.CLEAR_USAGE_REPORT]: () =>
    clearReport(BattleRecordArchiveEvent.CLEAR_USAGE_REPORT),
});

export function runBattleReportAutomation(event, deps = {}) {
  return reportEventHandlers[event?.type]?.(event, deps);
}
