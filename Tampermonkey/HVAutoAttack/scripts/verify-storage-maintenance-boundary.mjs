import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const violations = [];

function source(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function productionFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return productionFiles(absolute);
    if (!entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) return [];
    return [absolute];
  });
}

function requireAll(file, values) {
  const text = source(file);
  for (const value of values) {
    if (!text.includes(value)) violations.push(`${file} must own ${value}`);
  }
  return text;
}

const migration = requireAll("src/state/storage-maintenance-migration.js", [
  "maxRecords: 8",
  "maxBytes: 8 * 1024 * 1024",
  '"copiedVerified"',
  '"sourceDeleted"',
  "source.writeTarget(value)",
  "source.readTarget()",
  "source.verifyTargetHash",
  "source.readSource()",
  "storageMaintenanceValueHash",
  "source.removeSource()",
  "requestIdleCallback",
  "changed since preview",
]);
const orderedMigrationSteps = [
  "source.writeTarget(value)",
  "source.readTarget()",
  'writeReceipt(source, description, "copiedVerified")',
  "source.readSource()",
  "source.removeSource()",
  'writeReceipt(source, description, "sourceDeleted")',
];
let cursor = -1;
for (const step of orderedMigrationSteps) {
  const next = migration.indexOf(step, cursor + 1);
  if (next < 0) violations.push(`migration order is missing ${step}`);
  else cursor = next;
}

requireAll("src/state/storage-maintenance.js", [
  "SAFE_PAGE_KINDS",
  "UserFeedbackEvent.CONFIRM",
  "RiddleSampleMigrationEvent.RUN_CONFIRMED",
  "StorageIoAcceptanceEvent.BEGIN",
  "StorageIoAcceptanceEvent.REPORT",
  "存储维护：预览并迁移旧数据",
]);
requireAll("src/state/storage-maintenance-receipt-indexeddb.js", [
  'const STORE_RECEIPTS = "receipts"',
  "dbName",
  "store.put(receipt, receipt.sourceId)",
]);
requireAll("src/state/storage-maintenance-legacy-adapter.js", [
  'legacyApi("GM_getValue", "getValue")',
  'legacyApi("GM_deleteValue", "deleteValue")',
  "readKey",
  "removeKeys",
]);
requireAll("src/state/storage-maintenance-battle-sources.js", [
  "BattleReportHistoryEvent.LIST_ENVELOPES",
  "BattleSessionCheckpointEvent.READ_SLICE",
  "target contains newer session data",
]);
requireAll("src/state/storage-maintenance-record-sources.js", [
  "StaminaLossStoreEvent.LIST_RECORDS",
  "LearnedMonsterStoreEvent.READ_RECORDS",
  "learned monster target conflict",
]);
requireAll("src/state/storage-maintenance-hvut-sources.js", [
  "HVUT derived target contains newer data",
  "retainLegacyAndReviewConflict",
]);
requireAll("src/state/storage-io-acceptance.test.js", [
  "for (let turn = 1; turn <= 100; turn += 1)",
  "gmPhysicalWrites: 0",
  "reductionFloorPercent: 100",
  "toHaveBeenCalledTimes(5)",
]);
requireAll("src/pages/app-startup.js", [
  '"registerStorageMenus"',
  "StorageMaintenanceEvent.REGISTER_MENU",
]);

const retiredKeys =
  /STORAGE_KEYS\.(?:BATTLE_CODE|DROP|DROP_OLD|STATS|STATS_OLD|STAMINA_LOST_LOG|LEARNED_BIG_KILL|LEARNED_INCOMING_BURST)\b/;
const compatibilityOwners = new Set([
  "src/state/storage-maintenance-battle-sources.js",
  "src/state/storage-maintenance-record-sources.js",
]);
for (const file of productionFiles(srcRoot)) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");
  if (retiredKeys.test(text) && !compatibilityOwners.has(relative)) {
    violations.push(`${relative} accesses retired aggregate storage outside maintenance`);
  }
  if (/\blegacyRead\b/.test(text)) {
    violations.push(`${relative} reintroduces normal-runtime legacy hydration`);
  }
}

const dataset = source("src/state/riddle-dataset.js");
for (const retired of ["RiddleSampleMigrationEvent", "MIGRATE_LEGACY", "runMigration"]) {
  if (dataset.includes(retired)) {
    violations.push(`riddle-dataset.js exposes retired migration path ${retired}`);
  }
}

if (violations.length) {
  console.error("[verify-storage-maintenance-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-storage-maintenance-boundary] OK - verified migration is bounded, resumable, centrally owned, and retired aggregates are compatibility-only"
);
