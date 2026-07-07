import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";

const EVENT_RENDER_DROP_TABLE_BODY = "renderDropTableBody";
const EVENT_RENDER_USAGE_TABLE_BODY = "renderUsageTableBody";
const EVENT_CLEAR_DROP_REPORT = "clearDropReport";
const EVENT_CLEAR_USAGE_REPORT = "clearUsageReport";

export const SettingsBattleReportCommandEvent = Object.freeze({
  RENDER_DROP_TABLE_BODY: EVENT_RENDER_DROP_TABLE_BODY,
  RENDER_USAGE_TABLE_BODY: EVENT_RENDER_USAGE_TABLE_BODY,
  CLEAR_DROP_REPORT: EVENT_CLEAR_DROP_REPORT,
  CLEAR_USAGE_REPORT: EVENT_CLEAR_USAGE_REPORT,
});

function clearReport(event, monitorType) {
  runBattleMonitorAutomation({ type: monitorType });
  return { ok: true, type: event.type };
}

const settingsBattleReportCommandHandlers = Object.freeze({
  [EVENT_RENDER_DROP_TABLE_BODY]: () =>
    runBattleMonitorAutomation({ type: BattleMonitorEvent.RENDER_DROP_REPORT_TABLE_BODY }),
  [EVENT_RENDER_USAGE_TABLE_BODY]: () =>
    runBattleMonitorAutomation({ type: BattleMonitorEvent.RENDER_USAGE_REPORT_TABLE_BODY }),
  [EVENT_CLEAR_DROP_REPORT]: (event) => clearReport(event, BattleMonitorEvent.CLEAR_DROP_REPORT),
  [EVENT_CLEAR_USAGE_REPORT]: (event) => clearReport(event, BattleMonitorEvent.CLEAR_USAGE_REPORT),
});

export function runSettingsBattleReportCommand(event = { type: EVENT_RENDER_DROP_TABLE_BODY }) {
  return settingsBattleReportCommandHandlers[event?.type]?.(event);
}
