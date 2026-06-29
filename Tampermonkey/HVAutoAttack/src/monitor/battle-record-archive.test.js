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
  const delValue = vi.fn((key) => {
    delete values[key];
  });
  return {
    delValue,
    getValue: (key) => values[key],
    setValue,
    readLocalTimestampLabel: () => "finished",
    values,
  };
}

describe("runBattleRecordArchiveAutomation", () => {
  it("stores the current battle record before the final round", () => {
    const runtime = deps();

    const outcome = runBattleRecordArchiveAutomation(
      {
        type: BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD,
        record: { "#Credit": 5 },
        recordEach: true,
        roundNow: 1,
        roundAll: 2,
      },
      runtime
    );

    expect(outcome).toEqual({ archived: false });
    expect(runtime.values[STORAGE_KEYS.DROP]).toEqual({ "#Credit": 5 });
  });

  it("archives final-round records with battle code and nested end time", () => {
    const runtime = deps({ [STORAGE_KEYS.BATTLE_CODE]: "AR-10" });

    const outcome = runBattleRecordArchiveAutomation(
      {
        type: BattleRecordArchiveEvent.STORE_OR_ARCHIVE_USAGE_STATS,
        record: { self: { _turn: 3 } },
        recordEach: true,
        roundNow: 2,
        roundAll: 2,
      },
      runtime
    );

    expect(outcome.archived).toBe(true);
    expect(runtime.values[STORAGE_KEYS.STATS]).toBeUndefined();
    expect(runtime.values[STORAGE_KEYS.STATS_OLD]).toEqual([
      { __name: "AR-10", self: { _endTime: "finished", _turn: 3 } },
    ]);
  });

  it("clears a current/history record set through the same lifecycle entry", () => {
    const runtime = deps({
      [STORAGE_KEYS.DROP]: { "#Credit": 1 },
      [STORAGE_KEYS.DROP_OLD]: [{ "#Credit": 2 }],
    });

    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.CLEAR_RECORD_SET,
          currentKey: STORAGE_KEYS.DROP,
          historyKey: STORAGE_KEYS.DROP_OLD,
        },
        runtime
      )
    ).toBe(true);

    expect(runtime.values[STORAGE_KEYS.DROP]).toBeUndefined();
    expect(runtime.values[STORAGE_KEYS.DROP_OLD]).toBeUndefined();
  });
});
