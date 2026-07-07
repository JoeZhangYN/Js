import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { getValue, setValue } from "../state/storage.js";
import {
  SettingsBattleReportCommandEvent,
  runSettingsBattleReportCommand,
} from "./battle-report-command.js";

beforeEach(() => {
  localStorage.clear();
});

describe("settings battle report command entry", () => {
  it("renders drop and usage report table bodies through one settings command entry", () => {
    setValue(STORAGE_KEYS.DROP, { "#Credit": 12 });
    setValue(STORAGE_KEYS.STATS, { self: { _turn: 3 } });

    expect(
      runSettingsBattleReportCommand({
        type: SettingsBattleReportCommandEvent.RENDER_DROP_TABLE_BODY,
      })
    ).toContain("#Credit");
    expect(
      runSettingsBattleReportCommand({
        type: SettingsBattleReportCommandEvent.RENDER_USAGE_TABLE_BODY,
      })
    ).toContain("_turn");
  });

  it("clears drop and usage reports as settings report commands", () => {
    setValue(STORAGE_KEYS.DROP, { a: 1 });
    setValue(STORAGE_KEYS.DROP_OLD, [{ a: 2 }]);
    setValue(STORAGE_KEYS.STATS, { self: {} });
    setValue(STORAGE_KEYS.STATS_OLD, [{ self: {} }]);

    expect(
      runSettingsBattleReportCommand({
        type: SettingsBattleReportCommandEvent.CLEAR_DROP_REPORT,
      })
    ).toEqual({ ok: true, type: SettingsBattleReportCommandEvent.CLEAR_DROP_REPORT });
    expect(
      runSettingsBattleReportCommand({
        type: SettingsBattleReportCommandEvent.CLEAR_USAGE_REPORT,
      })
    ).toEqual({ ok: true, type: SettingsBattleReportCommandEvent.CLEAR_USAGE_REPORT });
    expect(getValue(STORAGE_KEYS.DROP, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.DROP_OLD, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.STATS, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.STATS_OLD, true)).toBeNull();
  });

  it("fails closed for unknown battle report commands", () => {
    expect(runSettingsBattleReportCommand({ type: "unknown" })).toBeUndefined();
    expect(runSettingsBattleReportCommand(null)).toBeUndefined();
  });
});
