import { makeStoreZip } from "../core/zip.js";
import { imgExt, sampleBaseName, strBytes } from "./riddle-dataset-export-format.js";
import { triggerRiddleDatasetDownload } from "./riddle-dataset-download.js";
import { recordRiddleDatasetFailure } from "./riddle-dataset-failure.js";
import { RIDDLE_DATASET_STATUS_COPY, reportRiddleDatasetStatus } from "./riddle-dataset-status.js";
import { RiddleSampleStoreEvent } from "./riddle-sample-store.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

function imageExtension(record) {
  if (!record.imageType) return "webp";
  return imgExt(`data:${record.imageType},`);
}

function exportMetadata(record) {
  return {
    saved_at: record.savedAt,
    source: record.source,
    confidence: record.confidence,
    answers: record.answers,
    image_src: record.imageSrc,
  };
}

async function exportFiles(records) {
  const files = [];
  const used = new Set();
  for (const record of [...records].sort((a, b) => a.timestamp - b.timestamp)) {
    let base = sampleBaseName(`saved_${record.id}`);
    if (used.has(base)) {
      let suffix = 2;
      while (used.has(`${base}_${suffix}`)) suffix += 1;
      base = `${base}_${suffix}`;
    }
    used.add(base);
    files.push({
      name: `${base}.json`,
      bytes: strBytes(JSON.stringify(exportMetadata(record), null, 2)),
    });
    if (record.imageBlob) {
      files.push({
        name: `${base}.${imageExtension(record)}`,
        bytes: new Uint8Array(await record.imageBlob.arrayBuffer()),
      });
    }
  }
  return files;
}

export async function exportRiddleDatasetRecords(runStore) {
  try {
    const records = await runStore({ type: RiddleSampleStoreEvent.LIST });
    if (!records.length) {
      reportRiddleDatasetStatus(RIDDLE_DATASET_STATUS_COPY.EMPTY_SAMPLE_STORE);
      return { outcome: StorageWriteOutcome.SKIPPED_POLICY, count: 0 };
    }
    const files = await exportFiles(records);
    if (!files.length) {
      reportRiddleDatasetStatus(RIDDLE_DATASET_STATUS_COPY.EMPTY_EXPORTABLE_SAMPLE_STORE);
      return { outcome: StorageWriteOutcome.SKIPPED_POLICY, count: 0 };
    }
    if (!triggerRiddleDatasetDownload(makeStoreZip(files))) {
      return { outcome: StorageWriteOutcome.FAILED, count: 0 };
    }
    const deletion = await runStore({
      type: RiddleSampleStoreEvent.DELETE_EXPORTED,
      ids: records.map((record) => record.id),
    });
    reportRiddleDatasetStatus(RIDDLE_DATASET_STATUS_COPY.EXPORT_SUCCESS, {
      count: deletion.deleted,
    });
    return { outcome: StorageWriteOutcome.DELETED, count: deletion.deleted };
  } catch (error) {
    recordRiddleDatasetFailure("export", { error: error?.message || String(error) });
    return { outcome: StorageWriteOutcome.FAILED, count: 0, error };
  }
}
