import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

import { StorageWriteOutcome } from "../state/storage-io-policy.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { BATTLE_RECORD_ARCHIVE_FAILURE_KEY } from "./battle-record-archive-failure.js";
import { createBattleRecordArchiveTestDeps } from "./battle-record-archive-test-fixture.js";

function lastFailure() {
  return JSON.parse(sessionStorage.getItem(BATTLE_RECORD_ARCHIVE_FAILURE_KEY));
}

beforeEach(() => {
  sessionStorage.clear();
  mocks.runDiagnosticConsoleAutomation.mockReset();
});

describe("battle record archive persistence failures", () => {
  it("does not report report-start success when the session checkpoint fails", () => {
    const runtime = createBattleRecordArchiveTestDeps();
    const baseRun = runtime.runCheckpoint;
    runtime.runCheckpoint = (event) => {
      if (event.type === "checkpointSlice") {
        return { outcome: StorageWriteOutcome.FAILED, error: new Error("checkpoint blocked") };
      }
      return baseRun(event);
    };

    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING,
          enabled: true,
          code: "AR-10",
        },
        runtime
      )
    ).toBe(false);
    expect(lastFailure()).toMatchObject({
      stage: "runtime-checkpoint",
      key: "battleReport",
      failure: { kind: "storageWrite", error: "checkpoint blocked" },
    });
  });

  it("exposes asynchronous archive failure through completion", async () => {
    const runtime = createBattleRecordArchiveTestDeps();
    runBattleRecordArchiveAutomation(
      {
        type: BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING,
        enabled: true,
        code: "AR-10",
      },
      runtime
    );
    runtime.runHistory = async () => ({
      outcome: StorageWriteOutcome.FAILED,
      error: new Error("history blocked"),
    });

    const result = runBattleRecordArchiveAutomation(
      {
        type: BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD,
        record: { "#Credit": 5 },
        recordEach: true,
        roundNow: 2,
        roundAll: 2,
      },
      runtime
    );

    expect(result.archived).toBe(true);
    expect(await result.completion).toBe(false);
  });

  it("does not report clear success when legacy deletion fails", async () => {
    const runtime = createBattleRecordArchiveTestDeps();
    runtime.delValue = () => {
      throw new Error("legacy delete blocked");
    };

    expect(
      await runBattleRecordArchiveAutomation(
        { type: BattleRecordArchiveEvent.CLEAR_USAGE_REPORT },
        runtime
      )
    ).toBe(false);
    expect(lastFailure()).toMatchObject({
      stage: "clear-legacy-history",
      key: "usage",
      failure: { error: "legacy delete blocked" },
    });
  });
});
