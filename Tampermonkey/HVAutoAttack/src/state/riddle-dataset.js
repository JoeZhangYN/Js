// 「带置信度的答题训练样本集」唯一业务入口。
// 样本本体使用 IndexedDB Blob；GM `saved_*` 只由确认式兼容迁移器读取。
import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { exportRiddleDatasetRecords } from "./riddle-dataset-export.js";
import { recordRiddleDatasetFailure } from "./riddle-dataset-failure.js";
import {
  discloseRiddleDatasetStatus,
  RIDDLE_DATASET_STATUS_COPY,
} from "./riddle-dataset-status.js";
import { createRiddleSampleRecord, dataUrlToBlob } from "./riddle-sample-content.js";
import { RiddleSampleStoreEvent, runRiddleSampleStoreAutomation } from "./riddle-sample-store.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

const EVENT_RECORD_SAMPLE = "recordSample";
const EVENT_EXPORT = "export";
const EVENT_INSPECT = "inspect";
const EVENT_REGISTER_EXPORT_MENU = "registerExportMenu";

export const RiddleDatasetEvent = Object.freeze({
  RECORD_SAMPLE: EVENT_RECORD_SAMPLE,
  EXPORT: EVENT_EXPORT,
  INSPECT: EVENT_INSPECT,
  REGISTER_EXPORT_MENU: EVENT_REGISTER_EXPORT_MENU,
});

export const RiddleSampleSource = Object.freeze({ ML: "ml", RANDOM: "random", MANUAL: "manual" });

function confidenceOf(source) {
  return source === RiddleSampleSource.RANDOM ? "low" : "high";
}

function sampleId(now, randomId) {
  const stamp = runTimeAutomation({ type: TimeEvent.LOCAL_FILE_TIMESTAMP, stamp: now });
  return `pony_${stamp}_${randomId()}`;
}

export function createRiddleDatasetCapability(deps = {}) {
  const runStore = deps.runStore || runRiddleSampleStoreAutomation;
  const now = deps.now || (() => Date.now());
  let sequence = 0;
  const randomId =
    deps.randomId ||
    (() => globalThis.crypto?.randomUUID?.() || `${now().toString(36)}-${(sequence += 1)}`);
  let menuRegistered = false;
  let captureFailureDisclosed = false;

  async function recordRiddleSample({ imageDataUrl, answers, source, imageSrc }) {
    const timestamp = now();
    const src = source || RiddleSampleSource.MANUAL;
    try {
      const record = await createRiddleSampleRecord(
        {
          id: sampleId(timestamp, randomId),
          savedAt: runTimeAutomation({ type: TimeEvent.ISO_TIMESTAMP, stamp: timestamp }),
          timestamp,
          source: src,
          confidence: confidenceOf(src),
          answers: answers || "",
          imageSrc: imageSrc || "unknown",
          imageBlob: dataUrlToBlob(imageDataUrl),
        },
        deps
      );
      const result = await runStore({
        type: RiddleSampleStoreEvent.WRITE,
        record,
        sourceIdentity: "riddleSubmission",
      });
      if (result.outcome === StorageWriteOutcome.REJECTED_BUDGET) {
        discloseRiddleDatasetStatus(RIDDLE_DATASET_STATUS_COPY.CAPTURE_REJECTED);
      }
      return result;
    } catch (error) {
      recordRiddleDatasetFailure("record-write", {
        error: error?.message || String(error),
        recovery: "exportOrRetryOutsideBattle",
      });
      if (!captureFailureDisclosed) {
        captureFailureDisclosed = true;
        discloseRiddleDatasetStatus(RIDDLE_DATASET_STATUS_COPY.CAPTURE_FAILED);
      }
      return { outcome: StorageWriteOutcome.FAILED, error, recovery: "continueSubmission" };
    }
  }

  const exportRiddleDataset = () => exportRiddleDatasetRecords(runStore);

  function registerExportMenu() {
    if (menuRegistered) return false;
    const register = globalThis.GM_registerMenuCommand;
    if (typeof register !== "function") return false;
    menuRegistered = true;
    register("导出答题训练样本(zip: 图片+json)", () => void exportRiddleDataset());
    return true;
  }

  const handlers = Object.freeze({
    [EVENT_RECORD_SAMPLE]: recordRiddleSample,
    [EVENT_EXPORT]: exportRiddleDataset,
    [EVENT_INSPECT]: () => runStore({ type: RiddleSampleStoreEvent.INSPECT }),
    [EVENT_REGISTER_EXPORT_MENU]: registerExportMenu,
  });

  return Object.freeze({
    run(event) {
      return handlers[event?.type]?.(event);
    },
  });
}

const currentRiddleDataset = createRiddleDatasetCapability();

export function runRiddleDatasetAutomation(event) {
  return currentRiddleDataset.run(event);
}
