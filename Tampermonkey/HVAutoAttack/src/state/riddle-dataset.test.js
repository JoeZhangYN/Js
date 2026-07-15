import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRiddleDatasetCapability,
  RiddleDatasetEvent,
  RiddleSampleSource,
} from "./riddle-dataset.js";
import { RiddleSampleStoreEvent } from "./riddle-sample-store.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

beforeEach(() => {
  sessionStorage.clear();
  window.alert = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function capability(runStore = vi.fn()) {
  return {
    runStore,
    dataset: createRiddleDatasetCapability({
      runStore,
      runMigration: vi.fn(),
      now: () => Date.parse("2026-06-27T00:00:01Z"),
      randomId: () => "sample-id",
      cryptoApi: null,
    }),
  };
}

describe("riddle dataset entry", () => {
  it("rejects unknown and null events without touching storage", () => {
    const { dataset, runStore } = capability();

    expect(dataset.run({ type: "unknown" })).toBeUndefined();
    expect(dataset.run(null)).toBeUndefined();
    expect(runStore).not.toHaveBeenCalled();
  });

  it("writes a Blob sample and derives low confidence from random fallback", async () => {
    const { dataset, runStore } = capability(
      vi.fn().mockResolvedValue({
        outcome: StorageWriteOutcome.WRITTEN,
        usage: { completedRecords: 1, bytes: 10 },
      })
    );

    await dataset.run({
      type: RiddleDatasetEvent.RECORD_SAMPLE,
      imageDataUrl: "data:image/webp;base64,AAAA",
      answers: "ra",
      source: RiddleSampleSource.RANDOM,
      imageSrc: "pony.webp",
    });

    expect(runStore).toHaveBeenCalledWith({
      type: RiddleSampleStoreEvent.WRITE,
      sourceIdentity: "riddleSubmission",
      record: expect.objectContaining({
        id: "pony_2026-06-27_00-00-01_sample-id",
        source: "random",
        confidence: "low",
        answers: "ra",
        imageSrc: "pony.webp",
        imageBlob: expect.any(Blob),
        imageBytes: 3,
        contentHash: expect.stringMatching(/^fnv1a32:/),
      }),
    });
    expect(runStore.mock.calls[0][0].record).not.toHaveProperty("imageBase64");
  });

  it("returns a known failure result and discloses recovery without blocking submission", async () => {
    const { dataset } = capability(vi.fn().mockRejectedValue(new Error("idb quota")));

    await expect(
      dataset.run({
        type: RiddleDatasetEvent.RECORD_SAMPLE,
        answers: "ra",
        source: RiddleSampleSource.ML,
      })
    ).resolves.toMatchObject({
      outcome: StorageWriteOutcome.FAILED,
      recovery: "continueSubmission",
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleDatasetFailure"))).toMatchObject({
      capability: "riddleDataset",
      stage: "record-write",
    });
    expect(window.alert).toHaveBeenCalledOnce();
  });

  it("registers export and confirmed migration menus exactly once", () => {
    const registerMenu = vi.fn();
    vi.stubGlobal("GM_registerMenuCommand", registerMenu);
    const { dataset } = capability();

    expect(dataset.run({ type: RiddleDatasetEvent.REGISTER_EXPORT_MENU })).toBe(true);
    expect(dataset.run({ type: RiddleDatasetEvent.REGISTER_EXPORT_MENU })).toBe(false);

    expect(registerMenu).toHaveBeenCalledTimes(2);
    expect(registerMenu.mock.calls.map(([label]) => label)).toEqual([
      "导出答题训练样本(zip: 图片+json)",
      "迁移旧答题样本到 IndexedDB（需确认）",
    ]);
  });
});
