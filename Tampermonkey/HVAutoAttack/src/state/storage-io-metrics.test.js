import { describe, expect, it, vi } from "vitest";
import {
  createStorageIoMetricsCapability,
  measureStorageLogicalBytes,
  StorageIoMetricsEvent,
} from "./storage-io-metrics.js";
import { StorageIdentity, StorageWriteOutcome } from "./storage-io-policy.js";

describe("storage IO metrics", () => {
  it("records physical, skipped, rejected and failed outcomes without persistence", () => {
    const metrics = createStorageIoMetricsCapability({ now: vi.fn(() => 1234) });
    for (const outcome of [
      StorageWriteOutcome.WRITTEN,
      StorageWriteOutcome.SKIPPED_UNCHANGED,
      StorageWriteOutcome.REJECTED_BUDGET,
      StorageWriteOutcome.FAILED,
      StorageWriteOutcome.DELETED,
    ]) {
      metrics.run({
        type: StorageIoMetricsEvent.RECORD,
        identity: StorageIdentity.WORLD_SMALL_VALUE,
        outcome,
        logicalBytes: 10,
        sourceIdentity: "hv:persistent",
      });
    }

    expect(metrics.run({ type: StorageIoMetricsEvent.SNAPSHOT })).toEqual({
      [StorageIdentity.WORLD_SMALL_VALUE]: expect.objectContaining({
        attemptedWrites: 5,
        physicalWrites: 2,
        skippedWrites: 1,
        rejectedWrites: 1,
        failedWrites: 1,
        deletes: 1,
        logicalBytesAttempted: 50,
        logicalBytesWritten: 20,
        maximumLogicalBytes: 10,
        lastSourceIdentity: "hv:persistent",
        lastObservedAt: 1234,
      }),
    });
  });

  it("resets in-memory observations and rejects untyped records", () => {
    const metrics = createStorageIoMetricsCapability();
    expect(() =>
      metrics.run({
        type: StorageIoMetricsEvent.RECORD,
        identity: "unknown",
        outcome: StorageWriteOutcome.WRITTEN,
      })
    ).toThrow("Unknown storage identity");
    expect(metrics.run({ type: StorageIoMetricsEvent.RESET })).toEqual({});
  });

  it("measures key and serialized value bytes without throwing on cycles", () => {
    expect(measureStorageLogicalBytes("k", { ok: true })).toBeGreaterThan(1);
    const cyclic = {};
    cyclic.self = cyclic;
    expect(measureStorageLogicalBytes("key", cyclic)).toBe(3);
  });
});
