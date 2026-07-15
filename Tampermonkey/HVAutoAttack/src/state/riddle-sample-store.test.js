import { beforeEach, describe, expect, it, vi } from "vitest";
import { StorageWriteOutcome } from "./storage-io-policy.js";
import { createRiddleSampleIndexedDbAdapter } from "./riddle-sample-store-indexeddb.js";
import { makeRiddleSampleFakeIndexedDb } from "./riddle-sample-store-test-fixture.js";

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: vi.fn(),
}));

beforeEach(() => {
  sessionStorage.clear();
  vi.useRealTimers();
});

function sample(id, bytes = 4) {
  return {
    id,
    imageBlob: new Blob([new Uint8Array(bytes)], { type: "image/webp" }),
    imageBytes: bytes,
    metadataBytes: 10,
    totalBytes: bytes + 10,
    source: "manual",
    confidence: "high",
    answers: "ra",
    imageSrc: "pony.webp",
    contentHash: `hash:${id}`,
  };
}

describe("riddle sample IndexedDB authority", () => {
  it("stores Blob records and maintains atomic usage metadata", async () => {
    const adapter = createRiddleSampleIndexedDbAdapter({
      indexedDb: makeRiddleSampleFakeIndexedDb(),
    });

    const result = await adapter.appendSample(sample("one"), {
      completedRecords: 512,
      bytes: 128 * 1024 * 1024,
    });

    expect(result).toMatchObject({
      outcome: StorageWriteOutcome.WRITTEN,
      usage: { completedRecords: 1, bytes: 14 },
    });
    const persisted = await adapter.readSample("one");
    expect(persisted.imageBlob).toBeInstanceOf(Blob);
    expect(persisted).not.toHaveProperty("imageBase64");
    expect(await adapter.inspect()).toEqual({ completedRecords: 1, bytes: 14 });
  });

  it("rejects count and byte overflow without silently deleting unexported samples", async () => {
    const adapter = createRiddleSampleIndexedDbAdapter({
      indexedDb: makeRiddleSampleFakeIndexedDb(),
    });
    const budget = { completedRecords: 1, bytes: 16 };

    expect(await adapter.appendSample(sample("one"), budget)).toMatchObject({
      outcome: StorageWriteOutcome.WRITTEN,
    });
    expect(await adapter.appendSample(sample("two"), budget)).toMatchObject({
      outcome: StorageWriteOutcome.REJECTED_BUDGET,
      recovery: "exportRequired",
      usage: { completedRecords: 1, bytes: 14 },
    });

    expect((await adapter.listSamples()).map((record) => record.id)).toEqual(["one"]);
  });

  it("treats a repeated migration identity as idempotent", async () => {
    const adapter = createRiddleSampleIndexedDbAdapter({
      indexedDb: makeRiddleSampleFakeIndexedDb(),
    });
    const budget = { completedRecords: 512, bytes: 1024 };

    await adapter.appendSample(sample("legacy:saved_one"), budget);
    expect(await adapter.appendSample(sample("legacy:saved_one"), budget)).toMatchObject({
      outcome: StorageWriteOutcome.SKIPPED_UNCHANGED,
      usage: { completedRecords: 1, bytes: 14 },
    });
  });

  it("deletes only explicitly exported identities and recomputes usage", async () => {
    const adapter = createRiddleSampleIndexedDbAdapter({
      indexedDb: makeRiddleSampleFakeIndexedDb(),
    });
    const budget = { completedRecords: 512, bytes: 1024 };
    await adapter.appendSample(sample("one"), budget);
    await adapter.appendSample(sample("two"), budget);

    expect(await adapter.deleteSamples(["one"])).toEqual({
      outcome: StorageWriteOutcome.DELETED,
      deleted: 1,
      deletedBytes: 14,
      usage: { completedRecords: 1, bytes: 14 },
    });
    expect((await adapter.listSamples()).map((record) => record.id)).toEqual(["two"]);
  });
});
