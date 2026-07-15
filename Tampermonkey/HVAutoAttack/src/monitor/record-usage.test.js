import { beforeEach, describe, expect, it } from "vitest";
import { g } from "../state/store.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { getValue, setValue } from "../state/storage.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { StorageWriteOutcome } from "../state/storage-io-policy.js";
import { createBattleRecordArchiveTestDeps } from "./battle-record-archive-test-fixture.js";
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

function completionContext(overrides = {}) {
  return {
    recordUsage: true,
    recordEach: true,
    roundNow: 1,
    roundAll: 1,
    monsterAll: 3,
    bossAll: 1,
    ...overrides,
  };
}

describe("runBattleUsageAutomation", () => {
  it("rejects unknown and null usage events without changing usage records", () => {
    setValue(STORAGE_KEYS.STATS, { self: { _monster: 2, _boss: 1 } });

    expect(runBattleUsageAutomation({ type: "unknown" })).toBeUndefined();
    expect(runBattleUsageAutomation(null)).toBeUndefined();
    expect(getValue(STORAGE_KEYS.STATS, true)).toEqual({ self: { _monster: 2, _boss: 1 } });
  });

  it("does not archive completion usage when record usage is disabled", () => {
    const runtime = createBattleRecordArchiveTestDeps({
      [STORAGE_KEYS.STATS]: { self: { _monster: 0, _boss: 0 } },
    });
    runtime.readCompletionContext = () => completionContext({ recordUsage: false });

    expect(
      runBattleUsageAutomation({ type: BattleUsageEvent.RECORD_COMPLETED_USAGE }, runtime)
    ).toEqual({ kind: "skipped", reason: "recordUsageDisabled" });
    expect(runtime.values[STORAGE_KEYS.STATS]).toEqual({ self: { _monster: 0, _boss: 0 } });
  });

  it("archives completion usage through the incremental history entry", async () => {
    const runtime = createBattleRecordArchiveTestDeps({
      [STORAGE_KEYS.BATTLE_CODE]: "AR-1",
      [STORAGE_KEYS.STATS]: { self: { _monster: 0, _boss: 0 } },
    });
    runtime.readCompletionContext = () => completionContext();

    const result = runBattleUsageAutomation(
      { type: BattleUsageEvent.RECORD_COMPLETED_USAGE },
      runtime
    );

    expect(result).toMatchObject({
      kind: "recorded",
      archive: { archived: true, record: { __name: "AR-1" } },
    });
    expect(await result.archive.completion).toBe(true);
    expect(runtime.histories.get("usage").map(({ record }) => record)).toEqual([
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

  it("exposes asynchronous archive persistence failure", async () => {
    const runtime = createBattleRecordArchiveTestDeps({
      [STORAGE_KEYS.BATTLE_CODE]: "AR-1",
      [STORAGE_KEYS.STATS]: { self: { _monster: 0, _boss: 0 } },
    });
    runtime.readCompletionContext = () => completionContext();
    runtime.runHistory = async () => ({
      outcome: StorageWriteOutcome.FAILED,
      error: new Error("usage archive blocked"),
    });

    const result = runBattleUsageAutomation(
      { type: BattleUsageEvent.RECORD_COMPLETED_USAGE },
      runtime
    );

    expect(result.kind).toBe("recorded");
    expect(await result.archive.completion).toBe(false);
  });
});
