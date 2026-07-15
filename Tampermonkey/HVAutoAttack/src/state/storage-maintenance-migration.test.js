import { describe, expect, it, vi } from "vitest";
import { createStorageMaintenanceMigration } from "./storage-maintenance-migration.js";
import { storageMaintenanceValueHash } from "./storage-maintenance-value.js";

function harness(count = 1, overrides = {}) {
  const values = new Map(
    Array.from({ length: count }, (_, index) => [`source:${index}`, { value: index }])
  );
  const targets = new Map();
  const storedReceipts = new Map();
  const order = [];
  const receipts = {
    read: vi.fn(async (sourceId) => storedReceipts.get(sourceId) || null),
    write: vi.fn(async (receipt) => {
      order.push(`receipt:${receipt.state}:${receipt.sourceId}`);
      storedReceipts.set(receipt.sourceId, receipt);
      return receipt;
    }),
  };
  const sources = [...values.keys()].map((sourceId) => ({
    sourceId,
    targetIdentity: `target:${sourceId}`,
    normalize: (value) => value,
    readSource: vi.fn(async () => values.get(sourceId) ?? null),
    writeTarget: vi.fn(async (value) => {
      order.push(`write:${sourceId}`);
      targets.set(sourceId, structuredClone(value));
    }),
    readTarget: vi.fn(async () => {
      order.push(`read:${sourceId}`);
      return targets.get(sourceId) ?? null;
    }),
    verifyTargetHash: (hash, target) => storageMaintenanceValueHash(target) === hash,
    removeSource: vi.fn(async () => {
      order.push(`delete:${sourceId}`);
      values.delete(sourceId);
    }),
  }));
  const idle = vi.fn((callback) => callback());
  const migration = createStorageMaintenanceMigration(
    { sources, receipts },
    { requestIdle: idle, now: () => "2026-07-15T00:00:00.000Z", ...overrides }
  );
  return { migration, values, targets, storedReceipts, sources, idle, order };
}

describe("verified storage maintenance migration", () => {
  it("previews without mutation then verifies before deleting the source", async () => {
    const { migration, values, storedReceipts, order } = harness();
    const preview = await migration.preview();
    expect(preview).toMatchObject({ count: 1, batch: { maxRecords: 8 } });
    expect(values.size).toBe(1);

    await expect(migration.run(preview)).resolves.toMatchObject({ count: 1 });
    expect(order).toEqual([
      "write:source:0",
      "read:source:0",
      "receipt:copiedVerified:source:0",
      "delete:source:0",
      "receipt:sourceDeleted:source:0",
    ]);
    expect(storedReceipts.get("source:0")).toMatchObject({
      state: "sourceDeleted",
      contentHash: expect.stringMatching(/^fnv1a32:/),
    });
  });

  it("uses at most eight records per idle batch", async () => {
    const { migration, idle } = harness(9);
    await migration.run(await migration.preview());
    expect(idle).toHaveBeenCalledTimes(2);
  });

  it("requires a fresh preview when source size or content changes", async () => {
    const { migration, values, sources } = harness();
    const preview = await migration.preview();
    values.set("source:0", { value: "changed" });

    await expect(migration.run(preview)).rejects.toMatchObject({
      recovery: "previewAgain",
    });
    expect(sources[0].writeTarget).not.toHaveBeenCalled();
    expect(sources[0].removeSource).not.toHaveBeenCalled();
  });

  it("does not delete a source that changes after target verification", async () => {
    const { migration, sources } = harness();
    sources[0].readSource.mockResolvedValueOnce({ value: 1 }).mockResolvedValueOnce({ value: 2 });
    const preview = await migration.preview();
    sources[0].readSource
      .mockReset()
      .mockResolvedValueOnce({ value: 1 })
      .mockResolvedValueOnce({ value: 2 });

    await expect(migration.run(preview)).rejects.toThrow("changed before deletion");
    expect(sources[0].removeSource).not.toHaveBeenCalled();
  });

  it("recovers a copied receipt after its source was already removed", async () => {
    const { migration, values, targets, storedReceipts } = harness();
    const value = values.get("source:0");
    targets.set("source:0", value);
    values.delete("source:0");
    storedReceipts.set("source:0", {
      sourceId: "source:0",
      targetIdentity: "target:source:0",
      state: "copiedVerified",
      contentHash: storageMaintenanceValueHash(value),
      bytes: 10,
    });

    await expect(migration.run(await migration.preview())).resolves.toMatchObject({ count: 1 });
    expect(storedReceipts.get("source:0")).toMatchObject({
      state: "sourceDeleted",
      sourceAlreadyMissing: true,
    });
  });

  it("is exactly-once after a source-deleted receipt", async () => {
    const { migration, sources } = harness();
    await migration.run(await migration.preview());

    await expect(migration.preview()).resolves.toMatchObject({ count: 0 });
    expect(sources[0].writeTarget).toHaveBeenCalledOnce();
    expect(sources[0].removeSource).toHaveBeenCalledOnce();
  });
});
