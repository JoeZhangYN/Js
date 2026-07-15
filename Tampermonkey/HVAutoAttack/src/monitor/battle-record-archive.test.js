import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { createBattleRecordArchiveTestDeps } from "./battle-record-archive-test-fixture.js";

describe("runBattleRecordArchiveAutomation", () => {
  it("rejects unknown and null archive events without changing records", () => {
    const runtime = createBattleRecordArchiveTestDeps({
      [STORAGE_KEYS.DROP]: { "#Credit": 5 },
    });

    expect(runBattleRecordArchiveAutomation({ type: "unknown" }, runtime)).toBeUndefined();
    expect(runBattleRecordArchiveAutomation(null, runtime)).toBeUndefined();
    expect(runtime.values[STORAGE_KEYS.DROP]).toEqual({ "#Credit": 5 });
  });

  it("keeps per-action current records in memory before the round boundary", () => {
    const runtime = createBattleRecordArchiveTestDeps();

    let outcome;
    for (let turn = 1; turn <= 100; turn += 1) {
      outcome = runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.STORE_USAGE_STATS,
          record: { self: { _turn: turn } },
        },
        runtime
      );
    }

    expect(outcome).toEqual({ archived: false });
    expect(runtime.readRuntime()).toMatchObject({
      kind: "loaded",
      checkpoint: { usage: { self: { _turn: 100 } } },
    });
    expect(runtime.values[STORAGE_KEYS.STATS]).toBeUndefined();
    expect(runtime.sessionWriteCount()).toBe(0);
  });

  it("archives final-round records as an incremental record", async () => {
    const runtime = createBattleRecordArchiveTestDeps();
    runtime.seedRuntime({ code: "AR-10" });

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
    expect(await outcome.completion).toBe(true);
    expect(runtime.histories.get("usage").map(({ record }) => record)).toEqual([
      { __name: "AR-10", self: { _endTime: "finished", _turn: 3 } },
    ]);
    expect(runtime.values[STORAGE_KEYS.STATS_OLD]).toBeUndefined();
  });

  it("converges concurrent drop and usage completion clears on the latest checkpoint", async () => {
    const runtime = createBattleRecordArchiveTestDeps();
    runtime.seedRuntime({ code: "AR-10" });
    const drop = runBattleRecordArchiveAutomation(
      {
        type: BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD,
        record: { "#Credit": 5 },
        recordEach: true,
        roundNow: 2,
        roundAll: 2,
      },
      runtime
    );
    const usage = runBattleRecordArchiveAutomation(
      {
        type: BattleRecordArchiveEvent.STORE_OR_ARCHIVE_USAGE_STATS,
        record: { self: { _turn: 3 } },
        recordEach: true,
        roundNow: 2,
        roundAll: 2,
      },
      runtime
    );

    expect(await Promise.all([drop.completion, usage.completion])).toEqual([true, true]);
    expect(runtime.readRuntime()).toMatchObject({
      kind: "loaded",
      checkpoint: { code: null, drop: null, usage: null },
    });
  });

  it("clears target drop records without deleting compatibility sources", async () => {
    const runtime = createBattleRecordArchiveTestDeps({
      [STORAGE_KEYS.DROP]: { "#Credit": 1 },
      [STORAGE_KEYS.DROP_OLD]: [{ "#Credit": 2 }],
    });
    runtime.seedRuntime({ drop: { "#Credit": 1 } });
    runtime.histories.get("drop").push({ id: "old", record: { "#Credit": 2 } });

    expect(
      await runBattleRecordArchiveAutomation(
        { type: BattleRecordArchiveEvent.CLEAR_DROP_REPORT },
        runtime
      )
    ).toBe(true);
    expect(runtime.readRuntime().checkpoint.drop).toBeNull();
    expect(runtime.histories.get("drop")).toEqual([]);
    expect(runtime.values[STORAGE_KEYS.DROP]).toEqual({ "#Credit": 1 });
    expect(runtime.values[STORAGE_KEYS.DROP_OLD]).toEqual([{ "#Credit": 2 }]);
  });

  it("clears target usage records without deleting compatibility sources", async () => {
    const runtime = createBattleRecordArchiveTestDeps({
      [STORAGE_KEYS.STATS]: { self: {} },
      [STORAGE_KEYS.STATS_OLD]: [{ self: {} }],
    });
    runtime.seedRuntime({ usage: { self: {} } });
    runtime.histories.get("usage").push({ id: "old", record: { self: {} } });

    expect(
      await runBattleRecordArchiveAutomation(
        { type: BattleRecordArchiveEvent.CLEAR_USAGE_REPORT },
        runtime
      )
    ).toBe(true);
    expect(runtime.readRuntime().checkpoint.usage).toBeNull();
    expect(runtime.histories.get("usage")).toEqual([]);
    expect(runtime.values[STORAGE_KEYS.STATS]).toEqual({ self: {} });
    expect(runtime.values[STORAGE_KEYS.STATS_OLD]).toEqual([{ self: {} }]);
  });
});
