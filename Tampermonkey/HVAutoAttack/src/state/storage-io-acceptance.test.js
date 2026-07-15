import { describe, expect, it, vi } from "vitest";
import {
  BattleSessionCheckpointEvent,
  BattleSessionCheckpointSlice,
  createBattleSessionCheckpointCapability,
} from "./battle-session-checkpoint.js";
import {
  createStorageIoAcceptanceCapability,
  StorageIoAcceptanceEvent,
} from "./storage-io-acceptance.js";
import { createStorageIoMetricsCapability, StorageIoMetricsEvent } from "./storage-io-metrics.js";
import { StorageIdentity } from "./storage-io-policy.js";

describe("Edge storage IO acceptance", () => {
  it("does not claim success before an acceptance window begins", () => {
    const metrics = createStorageIoMetricsCapability({ now: () => 1 });
    const acceptance = createStorageIoAcceptanceCapability({
      runMetrics: (event) => metrics.run(event),
      now: () => "2026-07-15T00:00:00.000Z",
    });

    expect(acceptance.run({ type: StorageIoAcceptanceEvent.REPORT })).toMatchObject({
      status: "notRecording",
      reductionFloorPercent: null,
    });
  });

  it("attributes zero GM writes and at most five checkpoints across 100 turns", () => {
    const metrics = createStorageIoMetricsCapability({ now: () => 1 });
    const sessionStorage = {
      value: null,
      getItem: vi.fn(() => sessionStorage.value),
      setItem: vi.fn((_key, value) => (sessionStorage.value = value)),
      removeItem: vi.fn(() => (sessionStorage.value = null)),
    };
    const checkpoint = createBattleSessionCheckpointCapability(
      { sourceIdentity: "hv:persistent" },
      {
        sessionStorage,
        recordIo: (event) => metrics.run({ type: StorageIoMetricsEvent.RECORD, ...event }),
      }
    );
    const acceptance = createStorageIoAcceptanceCapability({
      runMetrics: (event) => metrics.run(event),
      now: () => "2026-07-15T00:00:00.000Z",
    });
    acceptance.run({ type: StorageIoAcceptanceEvent.BEGIN });

    for (let turn = 1; turn <= 100; turn += 1) {
      checkpoint.run({
        type: BattleSessionCheckpointEvent.UPDATE_SLICE,
        slice: BattleSessionCheckpointSlice.BATTLE_REPORT,
        value: { usage: { turn } },
      });
      checkpoint.run({
        type: BattleSessionCheckpointEvent.CHECKPOINT,
        checkpoint: { globalTurn: turn },
      });
    }

    const report = acceptance.run({ type: StorageIoAcceptanceEvent.REPORT });
    expect(report).toMatchObject({
      status: "accepted",
      gmPhysicalWrites: 0,
      gmLogicalBytesWritten: 0,
      reductionFloorPercent: 100,
    });
    expect(report.metrics[StorageIdentity.SESSION_RUNTIME_CHECKPOINT].physicalWrites).toBe(5);
    expect(sessionStorage.setItem).toHaveBeenCalledTimes(5);
  });
});
