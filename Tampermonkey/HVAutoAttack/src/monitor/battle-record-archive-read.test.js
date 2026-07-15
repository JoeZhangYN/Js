import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { createBattleRecordArchiveTestDeps } from "./battle-record-archive-test-fixture.js";

describe("battle record archive reads", () => {
  it("creates current records with a start timestamp when none exists", () => {
    expect(
      runBattleRecordArchiveAutomation(
        { type: BattleRecordArchiveEvent.READ_OR_CREATE_USAGE_STATS },
        createBattleRecordArchiveTestDeps()
      )
    ).toMatchObject({ self: { _startTime: "finished", _turn: 0 } });
  });

  it("migrates legacy current records into the session checkpoint", () => {
    const current = { "#Credit": 5, "#startTime": "old" };
    const runtime = createBattleRecordArchiveTestDeps({ [STORAGE_KEYS.DROP]: current });

    expect(
      runBattleRecordArchiveAutomation(
        { type: BattleRecordArchiveEvent.READ_OR_CREATE_DROP_RECORD },
        runtime
      )
    ).toEqual(current);
    expect(runtime.values[STORAGE_KEYS.DROP]).toBeUndefined();
    expect(runtime.readRuntime()).toMatchObject({ kind: "loaded", checkpoint: { drop: current } });
  });

  it("returns null when no current usage record exists", () => {
    expect(
      runBattleRecordArchiveAutomation(
        { type: BattleRecordArchiveEvent.READ_USAGE_STATS },
        createBattleRecordArchiveTestDeps()
      )
    ).toBeNull();
  });

  it("combines legacy and incremental histories with the current name", async () => {
    const runtime = createBattleRecordArchiveTestDeps({
      [STORAGE_KEYS.BATTLE_CODE]: "now",
      [STORAGE_KEYS.DROP]: { "#Credit": 5 },
      [STORAGE_KEYS.DROP_OLD]: [{ __name: "old", "#EXP": 20 }],
    });
    runtime.histories.get("drop").push({
      id: "new",
      record: { __name: "new", "#Credit": 8 },
    });

    expect(
      await runBattleRecordArchiveAutomation(
        { type: BattleRecordArchiveEvent.READ_DROP_REPORT_SOURCE },
        runtime
      )
    ).toEqual({
      currentName: "now",
      currentRaw: { "#Credit": 5 },
      history: [
        { __name: "old", "#EXP": 20 },
        { __name: "new", "#Credit": 8 },
      ],
    });
  });

  it("starts report naming once in the bound runtime", () => {
    const runtime = createBattleRecordArchiveTestDeps();
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
    expect(runtime.readRuntime()).toMatchObject({
      kind: "loaded",
      checkpoint: { code: "6/27: AR-5" },
    });
  });

  it("does not start report naming when recording is disabled", () => {
    const runtime = createBattleRecordArchiveTestDeps();
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
    expect(runtime.readRuntime()).toEqual({ kind: "absent" });
  });
});
