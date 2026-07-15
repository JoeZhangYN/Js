import {
  describeStorageMaintenanceValue,
  storageMaintenanceValueHash,
} from "./storage-maintenance-value.js";

export const STORAGE_MAINTENANCE_BATCH = Object.freeze({
  maxRecords: 8,
  maxBytes: 8 * 1024 * 1024,
});

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

export function createStorageMaintenanceMigration({ sources, receipts }, deps = {}) {
  const sourceById = new Map(sources.map((source) => [source.sourceId, source]));
  const now = deps.now || (() => new Date().toISOString());
  const progress = deps.progress || (() => undefined);

  async function writeReceipt(source, description, state, detail = {}) {
    return receipts.write({
      sourceId: source.sourceId,
      targetIdentity: source.targetIdentity,
      ...description,
      state,
      observedAt: now(),
      ...detail,
    });
  }

  async function preview() {
    const records = [];
    for (const source of sources) {
      const receipt = await receipts.read(source.sourceId);
      if (receipt?.state === "sourceDeleted") continue;
      const value = await source.readSource();
      if (value === null || value === undefined) {
        if (receipt?.state === "copiedVerified") {
          records.push({
            sourceId: source.sourceId,
            bytes: receipt.bytes,
            contentHash: receipt.contentHash,
          });
        }
        continue;
      }
      records.push(describeStorageMaintenanceValue(source.sourceId, source.normalize(value)));
    }
    return Object.freeze({
      records,
      count: records.length,
      bytes: records.reduce((total, record) => total + record.bytes, 0),
      batch: STORAGE_MAINTENANCE_BATCH,
    });
  }

  async function recoverMissingSource(source, receipt) {
    if (receipt?.state !== "copiedVerified") return null;
    const target = await source.readTarget();
    if (!source.verifyTargetHash(receipt.contentHash, target)) return null;
    await writeReceipt(source, receipt, "sourceDeleted", { sourceAlreadyMissing: true });
    return { sourceId: source.sourceId, state: "sourceDeleted" };
  }

  async function migrateOne(source, expected) {
    const previous = await receipts.read(source.sourceId);
    if (previous?.state === "sourceDeleted") {
      return { sourceId: source.sourceId, state: "alreadyDone" };
    }
    const raw = await source.readSource();
    if (raw === null || raw === undefined) {
      const recovered = await recoverMissingSource(source, previous);
      if (recovered) return recovered;
      throw new Error(`legacy storage source disappeared: ${source.sourceId}`);
    }
    const value = source.normalize(raw);
    const description = describeStorageMaintenanceValue(source.sourceId, value);
    if (
      expected &&
      (description.contentHash !== expected.contentHash || description.bytes !== expected.bytes)
    ) {
      const error = new Error(`legacy storage source changed since preview: ${source.sourceId}`);
      error.recovery = "previewAgain";
      throw error;
    }
    await source.writeTarget(value);
    const target = await source.readTarget();
    if (!source.verifyTargetHash(description.contentHash, target)) {
      throw new Error(`storage migration verification failed: ${source.sourceId}`);
    }
    await writeReceipt(source, description, "copiedVerified");
    const latest = await source.readSource();
    if (
      latest === null ||
      latest === undefined ||
      storageMaintenanceValueHash(source.normalize(latest)) !== description.contentHash
    ) {
      throw new Error(`legacy storage source changed before deletion: ${source.sourceId}`);
    }
    await source.removeSource();
    await writeReceipt(source, description, "sourceDeleted");
    return { sourceId: source.sourceId, state: "sourceDeleted" };
  }

  async function run(previewResult) {
    const queue = [...previewResult.records];
    const completed = [];
    while (queue.length) {
      const batch = [];
      let batchBytes = 0;
      while (queue.length && batch.length < STORAGE_MAINTENANCE_BATCH.maxRecords) {
        const next = queue[0];
        if (next.bytes > STORAGE_MAINTENANCE_BATCH.maxBytes) {
          throw new Error(`legacy storage source exceeds 8 MiB batch: ${next.sourceId}`);
        }
        if (batch.length && batchBytes + next.bytes > STORAGE_MAINTENANCE_BATCH.maxBytes) break;
        queue.shift();
        batch.push(next);
        batchBytes += next.bytes;
      }
      progress({ completed: completed.length, total: previewResult.count, batch: batch.length });
      const results = await scheduleIdle(
        () =>
          Promise.all(batch.map((record) => migrateOne(sourceById.get(record.sourceId), record))),
        deps
      );
      completed.push(...results);
    }
    progress({ completed: completed.length, total: previewResult.count, batch: 0 });
    return Object.freeze({ count: completed.length, completed });
  }

  return Object.freeze({ preview, run });
}
