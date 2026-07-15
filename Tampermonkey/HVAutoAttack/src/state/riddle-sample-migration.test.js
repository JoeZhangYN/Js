import { describe, expect, it, vi } from "vitest";
import { PageKind } from "../pages/page-kind.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";
import {
  createRiddleSampleMigrationCapability,
  RiddleSampleMigrationEvent,
} from "./riddle-sample-migration.js";
import { RiddleSampleStoreEvent } from "./riddle-sample-store.js";

function legacyEntry(timestamp = 1) {
  return {
    json: {
      saved_at: new Date(timestamp).toISOString(),
      source: "ml",
      confidence: "high",
      answers: "ra",
      image_src: "pony.webp",
    },
    imageBase64: "data:image/webp;base64,AAAA",
    timestamp,
  };
}

function harness(count = 1, overrides = {}) {
  const source = new Map(
    Array.from({ length: count }, (_, index) => [`saved_pony_${index + 1}`, legacyEntry(index + 1)])
  );
  const targets = new Map();
  const receipts = new Map();
  const order = [];
  const legacy = {
    listKeys: vi.fn(async () => [...source.keys()]),
    read: vi.fn(async (key) => source.get(key) || null),
    remove: vi.fn(async (key) => {
      order.push(`delete:${key}`);
      source.delete(key);
    }),
  };
  const runStore = vi.fn(async (event) => {
    if (event.type === RiddleSampleStoreEvent.RECEIPT_READ) {
      return receipts.get(event.sourceKey) || null;
    }
    if (event.type === RiddleSampleStoreEvent.WRITE) {
      order.push(`write:${event.record.id}`);
      targets.set(event.record.id, event.record);
      return { outcome: StorageWriteOutcome.WRITTEN };
    }
    if (event.type === RiddleSampleStoreEvent.READ) {
      order.push(`read:${event.id}`);
      return targets.get(event.id) || null;
    }
    if (event.type === RiddleSampleStoreEvent.RECEIPT_WRITE) {
      order.push(`receipt:${event.receipt.state}:${event.receipt.sourceKey}`);
      receipts.set(event.receipt.sourceKey, event.receipt);
      return event.receipt;
    }
    return undefined;
  });
  const idle = vi.fn((callback) => callback());
  const migration = createRiddleSampleMigrationCapability({
    legacy,
    runStore,
    detectPage: () => ({ kind: PageKind.LOBBY }),
    confirm: () => true,
    requestIdle: idle,
    cryptoApi: null,
    ...overrides,
  });
  return { migration, legacy, runStore, source, targets, receipts, order, idle };
}

describe("verified legacy riddle sample migration", () => {
  it("previews without mutating and requires explicit confirmation", async () => {
    const { migration, legacy, targets, source } = harness(2, { confirm: () => false });

    const result = await migration.run({ type: RiddleSampleMigrationEvent.CONFIRM_AND_RUN });

    expect(result).toMatchObject({ confirmed: false, count: 0, preview: { count: 2 } });
    expect(legacy.remove).not.toHaveBeenCalled();
    expect(targets.size).toBe(0);
    expect(source.size).toBe(2);
  });

  it("writes, reads and verifies before receipt and source deletion", async () => {
    const { migration, source, receipts, order } = harness(1);

    await expect(
      migration.run({ type: RiddleSampleMigrationEvent.CONFIRM_AND_RUN })
    ).resolves.toMatchObject({ confirmed: true, count: 1 });

    expect(order).toEqual([
      "write:legacy:saved_pony_1",
      "read:legacy:saved_pony_1",
      "receipt:copiedVerified:saved_pony_1",
      "delete:saved_pony_1",
      "receipt:sourceDeleted:saved_pony_1",
    ]);
    expect(source.size).toBe(0);
    expect(receipts.get("saved_pony_1")).toMatchObject({
      state: "sourceDeleted",
      targetId: "legacy:saved_pony_1",
      contentHash: expect.stringMatching(/^fnv1a32:/),
    });
  });

  it("limits each idle batch to eight records", async () => {
    const { migration, idle } = harness(9);

    await migration.run({ type: RiddleSampleMigrationEvent.CONFIRM_AND_RUN });

    expect(idle).toHaveBeenCalledTimes(2);
  });

  it("refuses migration on battle and riddle pages before listing legacy keys", async () => {
    const battle = harness(1, { detectPage: () => ({ kind: PageKind.BATTLE }) });

    await expect(
      battle.migration.run({ type: RiddleSampleMigrationEvent.PREVIEW })
    ).rejects.toMatchObject({ recovery: "openLobbyAndRetry" });
    expect(battle.legacy.listKeys).not.toHaveBeenCalled();
  });
});
