import { UserFeedbackEvent, runUserFeedbackAutomation } from "../core/lang.js";
import { PageKind, PageKindEvent, runPageKindAutomation } from "../pages/page-kind.js";
import {
  RiddleSampleMigrationEvent,
  runRiddleSampleMigrationAutomation,
} from "./riddle-sample-migration.js";
import {
  runStorageIoAcceptanceAutomation,
  StorageIoAcceptanceEvent,
} from "./storage-io-acceptance.js";
import { storageMaintenancePreviewCopy } from "./storage-maintenance-copy.js";
import { recordStorageMaintenanceFailure } from "./storage-maintenance-failure.js";
import { createStorageMaintenanceMigration } from "./storage-maintenance-migration.js";
import { createCurrentStorageMaintenanceAuthority } from "./storage-maintenance-sources.js";
import { createStorageMaintenanceView } from "./storage-maintenance-view.js";

export const StorageMaintenanceEvent = Object.freeze({
  REGISTER_MENU: "registerMenu",
  PREVIEW: "preview",
  CONFIRM_AND_RUN: "confirmAndRun",
  BEGIN_IO_ACCEPTANCE: "beginIoAcceptance",
  SHOW_IO_ACCEPTANCE: "showIoAcceptance",
});

const SAFE_PAGE_KINDS = new Set([PageKind.LOBBY, PageKind.ISEKAI_LOBBY, PageKind.SHOWEQUIP]);

export function createStorageMaintenanceCapability(deps = {}) {
  const authority = deps.authority || createCurrentStorageMaintenanceAuthority(deps);
  const view = deps.view || createStorageMaintenanceView(deps.document);
  const detectPage = deps.detectPage || runPageKindAutomation;
  const feedback = deps.feedback || runUserFeedbackAutomation;
  const runRiddle = deps.runRiddle || runRiddleSampleMigrationAutomation;
  const runAcceptance = deps.runAcceptance || runStorageIoAcceptanceAutomation;
  const migration =
    deps.migration ||
    createStorageMaintenanceMigration(
      { sources: authority.sources, receipts: authority.receipts },
      {
        ...deps,
        progress: ({ completed, total }) =>
          view.show(`HVAA storage maintenance\nVerified aggregate sources: ${completed}/${total}`),
      }
    );
  let menuRegistered = false;

  function assertSafePage() {
    const page = detectPage({ type: PageKindEvent.DETECT_CURRENT });
    if (!SAFE_PAGE_KINDS.has(page?.kind)) {
      const error = new Error("storage maintenance requires an HV non-battle, non-riddle page");
      error.recovery = "openLobbyAndRetry";
      throw error;
    }
    return page;
  }

  async function preview() {
    assertSafePage();
    const [aggregate, riddle] = await Promise.all([
      migration.preview(),
      runRiddle({ type: RiddleSampleMigrationEvent.PREVIEW }),
    ]);
    return Object.freeze({
      world: authority.policy.auditIdentity,
      aggregate,
      riddle,
      count: aggregate.count + riddle.count,
      bytes: aggregate.bytes + riddle.bytes,
      sideEffects: Object.freeze([
        "write IndexedDB target",
        "read back target and verify content hash",
        "write resumable migration receipt",
        "delete only the verified legacy source",
      ]),
    });
  }

  async function confirmAndRun() {
    let summary;
    try {
      const migrationPreview = await preview();
      view.show(
        `HVAA storage maintenance preview\n${migrationPreview.count} source(s), ${(migrationPreview.bytes / 1024 / 1024).toFixed(2)} MiB`
      );
      if (!migrationPreview.count) return { confirmed: false, preview: migrationPreview, count: 0 };
      const confirmed = feedback({
        type: UserFeedbackEvent.CONFIRM,
        copy: storageMaintenancePreviewCopy(migrationPreview),
      });
      if (!confirmed) return { confirmed: false, preview: migrationPreview, count: 0 };
      const aggregate = await migration.run(migrationPreview.aggregate);
      view.show("HVAA storage maintenance\nAggregate sources verified. Migrating riddle samples…");
      const riddle = await runRiddle({
        type: RiddleSampleMigrationEvent.RUN_CONFIRMED,
        preview: migrationPreview.riddle,
      });
      summary = {
        confirmed: true,
        preview: migrationPreview,
        count: aggregate.count + riddle.count,
        aggregate,
        riddle,
      };
      view.show(`HVAA storage maintenance complete\nVerified and retired: ${summary.count}`);
      return Object.freeze(summary);
    } catch (error) {
      const evidence = recordStorageMaintenanceFailure("execute", error, { summary });
      view.show(
        `HVAA storage maintenance stopped\n${evidence.error}\nRecovery: ${evidence.recovery}`
      );
      throw error;
    }
  }

  function beginIoAcceptance() {
    const result = runAcceptance({ type: StorageIoAcceptanceEvent.BEGIN });
    view.show(
      "HVAA Edge IO acceptance recording\nKeep this page open, run the representative workload, then open the acceptance report. Navigation starts a new userscript runtime."
    );
    return result;
  }

  function showIoAcceptance() {
    const report = runAcceptance({ type: StorageIoAcceptanceEvent.REPORT });
    feedback({
      type: UserFeedbackEvent.PROMPT,
      copy: { l0: "存储 IO 验收报告（可复制）", l2: "Storage IO acceptance report (copyable)" },
      defaultValue: JSON.stringify(report, null, 2),
    });
    return report;
  }

  function registerMenu() {
    if (menuRegistered) return false;
    const register = deps.registerMenu || globalThis.GM_registerMenuCommand;
    if (typeof register !== "function") return false;
    menuRegistered = true;
    register("存储维护：预览并迁移旧数据", () => void confirmAndRun().catch(() => undefined));
    register("开始 Edge 存储 IO 验收（清零应用指标）", beginIoAcceptance);
    register("查看 Edge 存储 IO 验收报告（可复制）", showIoAcceptance);
    return true;
  }

  return Object.freeze({
    run(event) {
      if (event?.type === StorageMaintenanceEvent.REGISTER_MENU) return registerMenu();
      if (event?.type === StorageMaintenanceEvent.PREVIEW) return preview();
      if (event?.type === StorageMaintenanceEvent.CONFIRM_AND_RUN) return confirmAndRun();
      if (event?.type === StorageMaintenanceEvent.BEGIN_IO_ACCEPTANCE) {
        return beginIoAcceptance();
      }
      if (event?.type === StorageMaintenanceEvent.SHOW_IO_ACCEPTANCE) return showIoAcceptance();
      return undefined;
    },
  });
}

const currentStorageMaintenance = createStorageMaintenanceCapability();

export function runStorageMaintenanceAutomation(event) {
  return currentStorageMaintenance.run(event);
}
