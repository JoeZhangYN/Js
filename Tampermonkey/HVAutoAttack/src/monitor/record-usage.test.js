import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { g } from "../state/store.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { getValue, setValue } from "../state/storage.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { BATTLE_RECORD_ARCHIVE_FAILURE_KEY } from "./battle-record-archive-failure.js";
import { BattleUsageEvent, runBattleUsageAutomation } from "./record-usage.js";

beforeEach(() => {
  localStorage.clear();
  runOptionAutomation({
    type: OptionEvent.WRITE,
    option: { version: "10.0", recordUsage: false, recordEach: false },
  });
  g("roundNow", 1);
  g("roundAll", 1);
  g("monsterAll", 3);
  g("bossAll", 1);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runBattleUsageAutomation", () => {
  it("rejects unknown and null usage events without changing usage records", () => {
    setValue(STORAGE_KEYS.STATS, { self: { _monster: 2, _boss: 1 } });

    expect(runBattleUsageAutomation({ type: "unknown" })).toBeUndefined();
    expect(runBattleUsageAutomation(null)).toBeUndefined();

    expect(getValue(STORAGE_KEYS.STATS, true)).toEqual({ self: { _monster: 2, _boss: 1 } });
    expect(getValue(STORAGE_KEYS.STATS_OLD, true)).toBeNull();
  });

  it("does not archive completion usage when record usage is disabled", () => {
    setValue(STORAGE_KEYS.STATS, { self: { _monster: 0, _boss: 0 } });

    expect(runBattleUsageAutomation({ type: BattleUsageEvent.RECORD_COMPLETED_USAGE })).toBe(
      false
    );

    expect(getValue(STORAGE_KEYS.STATS, true)).toEqual({ self: { _monster: 0, _boss: 0 } });
    expect(getValue(STORAGE_KEYS.STATS_OLD, true)).toBeNull();
  });

  it("archives completion usage through the usage entry when enabled", () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "recordUsage", value: true });
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "recordEach", value: true });
    setValue(STORAGE_KEYS.BATTLE_CODE, "AR-1");
    setValue(STORAGE_KEYS.STATS, { self: { _monster: 0, _boss: 0 } });

    expect(runBattleUsageAutomation({ type: BattleUsageEvent.RECORD_COMPLETED_USAGE })).toEqual({
      archived: true,
      record: expect.objectContaining({ __name: "AR-1" }),
    });

    expect(getValue(STORAGE_KEYS.STATS, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.STATS_OLD, true)).toEqual([
      {
        __name: "AR-1",
        self: {
          _boss: 1,
          _endTime: expect.any(String),
          _monster: 3,
        },
      },
    ]);
  });

  it("does not report completion usage success when archive persistence fails", () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "recordUsage", value: true });
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "recordEach", value: true });
    setValue(STORAGE_KEYS.BATTLE_CODE, "AR-1");
    setValue(STORAGE_KEYS.STATS, { self: { _monster: 0, _boss: 0 } });
    vi.stubGlobal("GM_setValue", () => {
      throw new Error("usage archive blocked");
    });

    expect(runBattleUsageAutomation({ type: BattleUsageEvent.RECORD_COMPLETED_USAGE })).toBe(
      false
    );

    expect(JSON.parse(sessionStorage.getItem(BATTLE_RECORD_ARCHIVE_FAILURE_KEY))).toMatchObject({
      capability: "battleRecordArchive",
      stage: "archive-history",
      key: STORAGE_KEYS.STATS_OLD,
      failure: { kind: "storageWrite", error: "usage archive blocked" },
    });
  });
});
