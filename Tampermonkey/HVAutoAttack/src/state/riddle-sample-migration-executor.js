import { legacyRiddleSampleRecord } from "./riddle-sample-content.js";
import { measureLegacyRiddleSampleBytes } from "./riddle-sample-migration-size.js";
import { RiddleSampleStoreEvent } from "./riddle-sample-store.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

export const RIDDLE_MIGRATION_BATCH = Object.freeze({
  maxRecords: 8,
  maxBytes: 8 * 1024 * 1024,
});

function recordsMatch(expected, actual) {
  return Boolean(
    actual &&
    actual.id === expected.id &&
    actual.source === expected.source &&
    actual.confidence === expected.confidence &&
    actual.answers === expected.answers &&
    actual.imageSrc === expected.imageSrc &&
    actual.imageBytes === expected.imageBytes &&
    actual.totalBytes === expected.totalBytes &&
    actual.contentHash === expected.contentHash
  );
}

function scheduleIdle(run, deps) {
  const requestIdle = deps.requestIdle || globalThis.requestIdleCallback;
  if (typeof requestIdle === "function") {
    return new Promise((resolve, reject) => {
      requestIdle(() => Promise.resolve(run()).then(resolve, reject), { timeout: 1000 });
    });
  }
  return new Promise((resolve, reject) => {
    (deps.setTimeout || globalThis.setTimeout)(
      () => Promise.resolve(run()).then(resolve, reject),
      0
    );
  });
}

export function createRiddleSampleMigrationExecutor({ legacy, runStore, ...deps }) {
  async function writeReceipt(sourceKey, target, state, detail = {}) {
    const receipt = {
      sourceKey,
      targetId: target.id,
      contentHash: target.contentHash,
      totalBytes: target.totalBytes,
      state,
      observedAt: new Date().toISOString(),
      ...detail,
    };
    await runStore({ type: RiddleSampleStoreEvent.RECEIPT_WRITE, receipt });
    return receipt;
  }

  async function recoverMissingSource(sourceKey, receipt) {
    if (receipt?.state !== "copiedVerified") return null;
    const target = await runStore({ type: RiddleSampleStoreEvent.READ, id: receipt.targetId });
    if (target?.contentHash !== receipt.contentHash || target?.totalBytes !== receipt.totalBytes) {
      return null;
    }
    await writeReceipt(sourceKey, target, "sourceDeleted", { sourceAlreadyMissing: true });
    return { sourceKey, state: "sourceDeleted" };
  }

  async function migrateOne(expected) {
    const { sourceKey } = expected;
    const previousReceipt = await runStore({
      type: RiddleSampleStoreEvent.RECEIPT_READ,
      sourceKey,
    });
    if (previousReceipt?.state === "sourceDeleted") return { sourceKey, state: "alreadyDone" };
    const entry = await legacy.read(sourceKey);
    if (!entry) {
      const recovered = await recoverMissingSource(sourceKey, previousReceipt);
      if (recovered) return recovered;
      throw new Error(`legacy riddle sample disappeared before verification: ${sourceKey}`);
    }
    if (measureLegacyRiddleSampleBytes(entry) !== expected.bytes) {
      const error = new Error(`legacy riddle sample changed since preview: ${sourceKey}`);
      error.recovery = "previewAgain";
      throw error;
    }

    const target = await legacyRiddleSampleRecord(sourceKey, entry, deps);
    const writeResult = await runStore({
      type: RiddleSampleStoreEvent.WRITE,
      record: target,
      sourceIdentity: "riddleLegacyMigration",
    });
    if (writeResult.outcome === StorageWriteOutcome.REJECTED_BUDGET) {
      const error = new Error("riddle sample budget reached during migration");
      error.recovery = "exportRequired";
      error.usage = writeResult.usage;
      throw error;
    }
    const persisted = await runStore({ type: RiddleSampleStoreEvent.READ, id: target.id });
    if (!recordsMatch(target, persisted)) {
      throw new Error(`riddle sample verification failed: ${sourceKey}`);
    }
    await writeReceipt(sourceKey, target, "copiedVerified");

    const latestEntry = await legacy.read(sourceKey);
    const latestTarget = latestEntry
      ? await legacyRiddleSampleRecord(sourceKey, latestEntry, deps)
      : null;
    if (!latestTarget || latestTarget.contentHash !== target.contentHash) {
      throw new Error(`legacy riddle sample changed before deletion: ${sourceKey}`);
    }
    await legacy.remove(sourceKey);
    await writeReceipt(sourceKey, target, "sourceDeleted");
    return { sourceKey, state: "sourceDeleted", targetId: target.id };
  }

  async function run(previewResult) {
    const queue = [...previewResult.records];
    const completed = [];
    while (queue.length) {
      const batch = [];
      let batchBytes = 0;
      while (queue.length && batch.length < RIDDLE_MIGRATION_BATCH.maxRecords) {
        const next = queue[0];
        if (next.bytes > RIDDLE_MIGRATION_BATCH.maxBytes) {
          throw new Error(`legacy riddle sample exceeds 8 MiB migration batch: ${next.sourceKey}`);
        }
        if (batch.length && batchBytes + next.bytes > RIDDLE_MIGRATION_BATCH.maxBytes) break;
        queue.shift();
        batch.push(next);
        batchBytes += next.bytes;
      }
      const results = await scheduleIdle(
        () => Promise.all(batch.map((record) => migrateOne(record))),
        deps
      );
      completed.push(...results);
    }
    return Object.freeze({ count: completed.length, completed });
  }

  return Object.freeze({ run });
}
