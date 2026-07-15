import { afterEach, describe, expect, it, vi } from "vitest";
import { exportRiddleDatasetRecords } from "./riddle-dataset-export.js";
import { RiddleSampleStoreEvent } from "./riddle-sample-store.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function sample(imageBlob = null) {
  return {
    id: "pony_2026-06-27_00-00-01_one",
    savedAt: "2026-06-27T00:00:01.000Z",
    timestamp: 1,
    source: "ml",
    confidence: "high",
    answers: "ra",
    imageSrc: "pony.webp",
    imageBlob,
    imageType: imageBlob?.type,
  };
}

describe("riddle dataset archive export", () => {
  it("deletes exported identities only after the browser accepts the download", async () => {
    vi.useFakeTimers();
    const records = [sample(new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" }))];
    const runStore = vi.fn(async (event) =>
      event.type === RiddleSampleStoreEvent.LIST
        ? records
        : { outcome: StorageWriteOutcome.DELETED, deleted: 1 }
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:dataset");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    await expect(exportRiddleDatasetRecords(runStore)).resolves.toEqual({
      outcome: StorageWriteOutcome.DELETED,
      count: 1,
    });
    expect(runStore).toHaveBeenNthCalledWith(2, {
      type: RiddleSampleStoreEvent.DELETE_EXPORTED,
      ids: ["pony_2026-06-27_00-00-01_one"],
    });
    vi.runAllTimers();
  });

  it("keeps user samples when the browser blocks the download", async () => {
    const runStore = vi.fn(async (event) =>
      event.type === RiddleSampleStoreEvent.LIST ? [sample()] : undefined
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:dataset");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("download blocked");
    });

    await expect(exportRiddleDatasetRecords(runStore)).resolves.toMatchObject({
      outcome: StorageWriteOutcome.FAILED,
    });
    expect(runStore).toHaveBeenCalledTimes(1);
  });
});
