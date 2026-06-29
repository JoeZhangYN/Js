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
          type: BattleRecordArchiveEvent.READ_OR_CREATE_CURRENT,
          currentKey: STORAGE_KEYS.STATS,
          defaultRecord: { self: { _turn: 0 } },
          startTimeField: "self._startTime",
        },
        deps()
      )
    ).toEqual({ self: { _startTime: "finished", _turn: 0 } });
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
          type: BattleRecordArchiveEvent.READ_CURRENT,
          currentKey: STORAGE_KEYS.STATS,
        },
        deps({ [STORAGE_KEYS.STATS]: current })
      )
    ).toBe(current);
  });

  it("returns null when no current record exists", () => {
    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.READ_CURRENT,
          currentKey: STORAGE_KEYS.STATS,
        },
        deps()
      )
    ).toBeNull();
  });

  it("reads the current/history record set with current battle name", () => {
    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.READ_RECORD_SET,
          currentKey: STORAGE_KEYS.DROP,
          historyKey: STORAGE_KEYS.DROP_OLD,
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

  it("starts record naming once when recording is enabled", () => {
    const runtime = deps();

    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.START_RECORDING,
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
          type: BattleRecordArchiveEvent.START_RECORDING,
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
          type: BattleRecordArchiveEvent.START_RECORDING,
          enabled: false,
          code: "6/27: AR-5",
        },
        runtime
      )
    ).toBe(false);
    expect(runtime.values[STORAGE_KEYS.BATTLE_CODE]).toBeUndefined();
  });
});
