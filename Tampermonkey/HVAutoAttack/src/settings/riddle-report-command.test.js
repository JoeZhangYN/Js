import { beforeEach, describe, expect, it } from "vitest";
import { RiddleLogEvent, runRiddleLogAutomation } from "../state/riddle-log.js";
import { RiddleStatsEvent, runRiddleStatsAutomation } from "../state/riddle-stats.js";
import {
  SettingsRiddleReportCommandEvent,
  runSettingsRiddleReportCommand,
} from "./riddle-report-command.js";

beforeEach(() => {
  localStorage.clear();
});

describe("settings riddle report command entry", () => {
  it("renders the riddle report table body from stats and log entries", () => {
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_APPEAR });
    runRiddleLogAutomation({ type: RiddleLogEvent.PUSH, message: "<log>" });

    const html = runSettingsRiddleReportCommand({
      type: SettingsRiddleReportCommandEvent.RENDER_TABLE_BODY,
    });

    expect(html).toContain("<tbody>");
    expect(html).toContain("Riddle appearances");
    expect(html).toContain("Run log");
    expect(html).toContain("&lt;log&gt;");
    expect(html).toContain("</tbody>");
  });

  it("resets riddle stats and log as one settings report command", () => {
    runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_APPEAR });
    runRiddleLogAutomation({ type: RiddleLogEvent.PUSH, message: "manual" });

    expect(
      runSettingsRiddleReportCommand({ type: SettingsRiddleReportCommandEvent.RESET_REPORT })
    ).toMatchObject({ ok: true, type: SettingsRiddleReportCommandEvent.RESET_REPORT, log: [] });
    expect(
      runSettingsRiddleReportCommand({ type: SettingsRiddleReportCommandEvent.RENDER_TABLE_BODY })
    ).not.toContain("manual");
  });

  it("fails closed for unknown riddle report commands", () => {
    expect(runSettingsRiddleReportCommand({ type: "unknown" })).toBeUndefined();
    expect(runSettingsRiddleReportCommand(null)).toBeUndefined();
  });
});
