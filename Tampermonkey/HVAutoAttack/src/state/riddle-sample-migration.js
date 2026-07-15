import { UserFeedbackEvent, runUserFeedbackAutomation } from "../core/lang.js";
import { PageKind, PageKindEvent, runPageKindAutomation } from "../pages/page-kind.js";
import { recordRiddleDatasetFailure } from "./riddle-dataset-failure.js";
import { createRiddleLegacySampleAdapter } from "./riddle-legacy-sample-adapter.js";
import {
  createRiddleSampleMigrationExecutor,
  RIDDLE_MIGRATION_BATCH,
} from "./riddle-sample-migration-executor.js";
import { RiddleSampleStoreEvent, runRiddleSampleStoreAutomation } from "./riddle-sample-store.js";

export const RiddleSampleMigrationEvent = Object.freeze({
  PREVIEW: "preview",
  CONFIRM_AND_RUN: "confirmAndRun",
});

const MIGRATION_CONFIRM_COPY = Object.freeze({
  l0: "发现 {count} 条旧答题样本（约 {mib} MiB）。迁移会分批写入 IndexedDB Blob、回读校验并在成功后删除旧 GM 记录。现在开始？",
  l1: "發現 {count} 條舊答題樣本（約 {mib} MiB）。遷移會分批寫入 IndexedDB Blob、回讀校驗並在成功後刪除舊 GM 記錄。現在開始？",
  l2: "Found {count} legacy riddle sample(s), about {mib} MiB. Migrate in verified IndexedDB batches and delete each GM source only after verification?",
});

function estimatedLegacyBytes(entry) {
  try {
    return new TextEncoder().encode(JSON.stringify(entry)).byteLength;
  } catch {
    return 0;
  }
}

export function createRiddleSampleMigrationCapability(deps = {}) {
  const legacy = deps.legacy || createRiddleLegacySampleAdapter();
  const runStore = deps.runStore || runRiddleSampleStoreAutomation;
  const detectPage = deps.detectPage || runPageKindAutomation;
  const confirm = deps.confirm || runUserFeedbackAutomation;
  const executor = createRiddleSampleMigrationExecutor({ legacy, runStore, ...deps });

  function assertSafePage() {
    const page = detectPage({ type: PageKindEvent.DETECT_CURRENT });
    const safeKinds = new Set([PageKind.LOBBY, PageKind.ISEKAI_LOBBY, PageKind.SHOWEQUIP]);
    if (!safeKinds.has(page?.kind)) {
      const error = new Error("riddle sample migration requires an HV non-battle lobby page");
      error.recovery = "openLobbyAndRetry";
      throw error;
    }
    return page;
  }

  async function preview() {
    const page = assertSafePage();
    const keys = await legacy.listKeys();
    const records = [];
    for (const sourceKey of keys) {
      const receipt = await runStore({
        type: RiddleSampleStoreEvent.RECEIPT_READ,
        sourceKey,
      });
      if (receipt?.state === "sourceDeleted") continue;
      const entry = await legacy.read(sourceKey);
      if (!entry) continue;
      records.push({ sourceKey, bytes: estimatedLegacyBytes(entry) });
    }
    return Object.freeze({
      pageKind: page?.kind || PageKind.UNKNOWN,
      records,
      count: records.length,
      bytes: records.reduce((total, record) => total + record.bytes, 0),
      batch: RIDDLE_MIGRATION_BATCH,
    });
  }

  async function confirmAndRun() {
    let previewResult;
    try {
      previewResult = await preview();
      if (!previewResult.count) return { confirmed: false, preview: previewResult, count: 0 };
      const copy = Object.fromEntries(
        Object.entries(MIGRATION_CONFIRM_COPY).map(([language, text]) => [
          language,
          text
            .replace("{count}", String(previewResult.count))
            .replace("{mib}", (previewResult.bytes / 1024 / 1024).toFixed(2)),
        ])
      );
      const confirmed = confirm({ type: UserFeedbackEvent.CONFIRM, copy });
      if (!confirmed) return { confirmed: false, preview: previewResult, count: 0 };
      return {
        confirmed: true,
        preview: previewResult,
        ...(await executor.run(previewResult)),
      };
    } catch (error) {
      recordRiddleDatasetFailure("migration", {
        error: error?.message || String(error),
        recovery: error?.recovery,
        preview: previewResult,
      });
      throw error;
    }
  }

  return Object.freeze({
    run(event) {
      if (event?.type === RiddleSampleMigrationEvent.PREVIEW) return preview();
      if (event?.type === RiddleSampleMigrationEvent.CONFIRM_AND_RUN) return confirmAndRun();
      return undefined;
    },
  });
}

const currentRiddleSampleMigration = createRiddleSampleMigrationCapability();

export function runRiddleSampleMigrationAutomation(event) {
  return currentRiddleSampleMigration.run(event);
}
