import { describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";

function deps(values = {}) {
  const setValue = vi.fn((key, value) => {
    values[key] = value;
  });
  return {
    getValue: (key) => values[key],
    setValue,
    readLocalTimestampLabel: () => "finished",
    values,
  };
}

describe("battle record archive reads", () => {
  it("creates current records with a start timestamp when none exists", () => {
    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.READ_OR_CREATE_USAGE_STATS,
        },
        deps()
      )
    ).toMatchObject({ self: { _startTime: "finished", _turn: 0 } });
  });

  it("reads current records without rewriting their start timestamp", () => {
    const current = { "#Credit": 5, "#startTime": "old" };

    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.READ_OR_CREATE_DROP_RECORD,
        },
        deps({ [STORAGE_KEYS.DROP]: current })
      )
    ).toBe(current);
  });

  it("reads existing current records without creating a default record", () => {
    const current = { self: { _turn: 3 } };

    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.READ_USAGE_STATS,
        },
        deps({ [STORAGE_KEYS.STATS]: current })
      )
    ).toBe(current);
  });

  it("returns null when no current record exists", () => {
    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.READ_USAGE_STATS,
        },
        deps()
      )
    ).toBeNull();
  });

  it("reads the current/history record set with current battle name", () => {
    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.READ_DROP_REPORT_SOURCE,
        },
        deps({
          [STORAGE_KEYS.BATTLE_CODE]: "now",
          [STORAGE_KEYS.DROP]: { "#Credit": 5 },
          [STORAGE_KEYS.DROP_OLD]: [{ __name: "old", "#EXP": 20 }],
        })
      )
    ).toEqual({
      currentName: "now",
      currentRaw: { "#Credit": 5 },
      history: [{ __name: "old", "#EXP": 20 }],
    });
  });

  it("reads usage report record sets with current battle name", () => {
    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.READ_USAGE_REPORT_SOURCE,
        },
        deps({
          [STORAGE_KEYS.BATTLE_CODE]: "now",
          [STORAGE_KEYS.STATS]: { self: { _turn: 3 } },
          [STORAGE_KEYS.STATS_OLD]: [{ __name: "old", self: { _turn: 1 } }],
        })
      )
    ).toEqual({
      currentName: "now",
      currentRaw: { self: { _turn: 3 } },
      history: [{ __name: "old", self: { _turn: 1 } }],
    });
  });

  it("starts record naming once when recording is enabled", () => {
    const runtime = deps();

    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING,
          enabled: true,
          code: "6/27: AR-5",
        },
        runtime
      )
    ).toBe(true);
    expect(runtime.values[STORAGE_KEYS.BATTLE_CODE]).toBe("6/27: AR-5");

    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING,
          enabled: true,
          code: "6/27: RB-1",
        },
        runtime
      )
    ).toBe(false);
    expect(runtime.values[STORAGE_KEYS.BATTLE_CODE]).toBe("6/27: AR-5");
  });

  it("does not start record naming when recording is disabled", () => {
    const runtime = deps();

    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING,
          enabled: false,
          code: "6/27: AR-5",
        },
        runtime
      )
    ).toBe(false);
    expect(runtime.values[STORAGE_KEYS.BATTLE_CODE]).toBeUndefined();
  });
});
