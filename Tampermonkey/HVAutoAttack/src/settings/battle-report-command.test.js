import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { getValue, setValue } from "../state/storage.js";
import {
  BattleSessionCheckpointEvent,
  runBattleSessionCheckpointAutomation,
} from "../state/battle-session-checkpoint.js";
import {
  BattleReportFamily,
  clearBattleReportTargetHistory,
  seedActiveBattleReport,
  seedBattleReportHistory,
} from "../monitor/battle-report-test-fixture.js";
import {
  SettingsBattleReportCommandEvent,
  runSettingsBattleReportCommand,
} from "./battle-report-command.js";

beforeEach(async () => {
  localStorage.clear();
  runBattleSessionCheckpointAutomation({ type: BattleSessionCheckpointEvent.CLEAR });
  await clearBattleReportTargetHistory();
});

describe("settings battle report command entry", () => {
  it("renders drop and usage report table bodies through one settings command entry", async () => {
    seedActiveBattleReport({
      drop: { "#Credit": 12 },
      usage: { self: { _turn: 3 } },
    });

    expect(
      await runSettingsBattleReportCommand({
        type: SettingsBattleReportCommandEvent.RENDER_DROP_TABLE_BODY,
      })
    ).toContain("#Credit");
    expect(
      await runSettingsBattleReportCommand({
        type: SettingsBattleReportCommandEvent.RENDER_USAGE_TABLE_BODY,
      })
    ).toContain("_turn");
  });

  it("clears drop and usage reports as settings report commands", async () => {
    seedActiveBattleReport({
      drop: { a: 1 },
      usage: { self: { _turn: 1 } },
    });
    await seedBattleReportHistory(BattleReportFamily.DROP, "drop:old", { a: 2 });
    await seedBattleReportHistory(BattleReportFamily.USAGE, "usage:old", { self: { _turn: 2 } });
    setValue(STORAGE_KEYS.DROP, { a: 1 });
    setValue(STORAGE_KEYS.DROP_OLD, [{ a: 2 }]);
    setValue(STORAGE_KEYS.STATS, { self: {} });
    setValue(STORAGE_KEYS.STATS_OLD, [{ self: {} }]);

    expect(
      await runSettingsBattleReportCommand({
        type: SettingsBattleReportCommandEvent.CLEAR_DROP_REPORT,
      })
    ).toEqual({ ok: true, type: SettingsBattleReportCommandEvent.CLEAR_DROP_REPORT });
    expect(
      await runSettingsBattleReportCommand({
        type: SettingsBattleReportCommandEvent.CLEAR_USAGE_REPORT,
      })
    ).toEqual({ ok: true, type: SettingsBattleReportCommandEvent.CLEAR_USAGE_REPORT });
    expect(getValue(STORAGE_KEYS.DROP, true)).toEqual({ a: 1 });
    expect(getValue(STORAGE_KEYS.DROP_OLD, true)).toEqual([{ a: 2 }]);
    expect(getValue(STORAGE_KEYS.STATS, true)).toEqual({ self: {} });
    expect(getValue(STORAGE_KEYS.STATS_OLD, true)).toEqual([{ self: {} }]);
    expect(
      await runSettingsBattleReportCommand({
        type: SettingsBattleReportCommandEvent.RENDER_DROP_TABLE_BODY,
      })
    ).not.toContain("<td>a</td>");
    expect(
      await runSettingsBattleReportCommand({
        type: SettingsBattleReportCommandEvent.RENDER_USAGE_TABLE_BODY,
      })
    ).not.toContain("_turn");
  });

  it("fails closed for unknown battle report commands", () => {
    expect(runSettingsBattleReportCommand({ type: "unknown" })).toBeUndefined();
    expect(runSettingsBattleReportCommand(null)).toBeUndefined();
  });
});
