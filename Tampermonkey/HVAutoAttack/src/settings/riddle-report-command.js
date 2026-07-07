import { RiddleLogEvent, runRiddleLogAutomation } from "../state/riddle-log.js";
import { RiddleStatsEvent, runRiddleStatsAutomation } from "../state/riddle-stats.js";

const EVENT_RENDER_TABLE_BODY = "renderTableBody";
const EVENT_RESET_REPORT = "resetReport";

export const SettingsRiddleReportCommandEvent = Object.freeze({
  RENDER_TABLE_BODY: EVENT_RENDER_TABLE_BODY,
  RESET_REPORT: EVENT_RESET_REPORT,
});

function renderRiddleReportTableBody() {
  return (
    `<tbody>${runRiddleStatsAutomation({ type: RiddleStatsEvent.RENDER_REPORT_ROWS })}` +
    `${runRiddleLogAutomation({ type: RiddleLogEvent.RENDER_REPORT_ROWS })}</tbody>`
  );
}

function resetRiddleReport() {
  const stats = runRiddleStatsAutomation({ type: RiddleStatsEvent.RESET });
  const log = runRiddleLogAutomation({ type: RiddleLogEvent.CLEAR });
  return {
    ok: stats !== false && log !== false,
    type: EVENT_RESET_REPORT,
    stats,
    log,
  };
}

const settingsRiddleReportCommandHandlers = Object.freeze({
  [EVENT_RENDER_TABLE_BODY]: renderRiddleReportTableBody,
  [EVENT_RESET_REPORT]: resetRiddleReport,
});

export function runSettingsRiddleReportCommand(event = { type: EVENT_RENDER_TABLE_BODY }) {
  return settingsRiddleReportCommandHandlers[event?.type]?.(event);
}
