import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const violations = [];

// Transitional debt is exact and can only shrink. Each owner is retired by its named Epic Todo.
const transitionalRawWrites = new Map([
  ["src/pages/encounter-generation-incident.js", { count: 1, retire: "#2045" }],
  ["src/pages/encounter-generation-incident-clear.js", { count: 1, retire: "#2045" }],
  ["src/i18n/hv-utils.js", { count: 2, retire: "#2049" }],
]);

const memoryFirstBattleEvidence = [
  "src/battle/battle-action-decision-evidence.js",
  "src/battle/battle-action-lifecycle-evidence.js",
  "src/battle/battle-action-effect-evidence.js",
  "src/battle/battle-automation-evidence.js",
  "src/battle/battle-command-evidence.js",
  "src/battle/battle-completion-evidence.js",
  "src/battle/battle-lifecycle-evidence.js",
  "src/battle/battle-pause-evidence.js",
  "src/battle/battle-round-start-evidence.js",
  "src/battle/battle-turn-workflow-evidence.js",
  "src/battle/kill-bug-evidence.js",
  "src/battle/monster-status-repair-evidence.js",
];

function productionFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return productionFiles(absolute);
    if (!entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) return [];
    return [absolute];
  });
}

const found = new Map();
const rawWrite = /\b(?:GM_(?:setValue|deleteValue)|GM\.(?:setValue|deleteValue))\s*\(/g;
for (const file of productionFiles(srcRoot)) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const matches = [...fs.readFileSync(file, "utf8").matchAll(rawWrite)];
  if (matches.length) found.set(relative, matches.length);
}

for (const [file, count] of found) {
  const allowance = transitionalRawWrites.get(file);
  if (!allowance) violations.push(`${file} introduces ${count} raw GM write(s)`);
  else if (count !== allowance.count) {
    violations.push(
      `${file} raw GM write count changed: expected ${allowance.count}, found ${count}`
    );
  }
}
for (const [file, allowance] of transitionalRawWrites) {
  if (!found.has(file)) {
    violations.push(
      `${file} transitional allowance (${allowance.retire}) is stale; remove it from the guard`
    );
  }
}

const policy = fs.readFileSync(path.join(srcRoot, "state", "storage-io-policy.js"), "utf8");
for (const required of [
  "StorageIdentity",
  "StorageAuthority",
  "StorageWriteOutcome",
  "storageIoPolicyOf",
  "RIDDLE_SAMPLE",
  "SESSION_RUNTIME_CHECKPOINT",
  "DIAGNOSTIC_EVIDENCE",
]) {
  if (!policy.includes(required)) violations.push(`storage-io-policy.js must own ${required}`);
}

const storage = fs.readFileSync(path.join(srcRoot, "state", "storage.js"), "utf8");
for (const required of [
  "StorageIdentity.WORLD_SMALL_VALUE",
  "StorageWriteOutcome.DELETED",
  "StorageWriteOutcome.FAILED",
  "SKIPPED_UNCHANGED",
  "runStorageIoMetricsAutomation",
  "writeCanonicalStorageValue",
  "writeDiagnosticSessionSnapshot",
]) {
  if (!storage.includes(required)) violations.push(`storage.js must consume ${required}`);
}

const writeAdapter = fs.readFileSync(
  path.join(srcRoot, "state", "storage-write-adapter.js"),
  "utf8"
);
for (const required of [
  "canonicalizeStorageValue",
  "storageValueFingerprint",
  "StorageWriteOutcome.WRITTEN",
  "StorageWriteOutcome.SKIPPED_UNCHANGED",
]) {
  if (!writeAdapter.includes(required)) {
    violations.push(`storage-write-adapter.js must own ${required}`);
  }
}

const checkpoint = fs.readFileSync(
  path.join(srcRoot, "state", "battle-session-checkpoint.js"),
  "utf8"
);
for (const required of [
  "SESSION_RUNTIME_CHECKPOINT",
  "policy.budget.everyTurns",
  "lifecycleBoundary",
  "SKIPPED_POLICY",
  "sourceIdentity",
]) {
  if (!checkpoint.includes(required)) {
    violations.push(`battle-session-checkpoint.js must own ${required}`);
  }
}

const apiCallScript = fs.readFileSync(
  path.join(srcRoot, "battle", "battle-api-call-script.js"),
  "utf8"
);
if (!apiCallScript.includes('if (result === "accepted") return')) {
  violations.push("battle-api-call-script.js must not persist accepted per-action bridge evidence");
}

const cdTracker = fs.readFileSync(path.join(srcRoot, "state", "cd-tracker.js"), "utf8");
for (const retired of [
  "setValue(STORAGE_KEYS.GLOBAL_TURN",
  "setValue(STORAGE_KEYS.SKILL_LAST_USED",
]) {
  if (cdTracker.includes(retired)) violations.push(`cd-tracker.js must retire ${retired}`);
}

const riddleDataset = fs.readFileSync(path.join(srcRoot, "state", "riddle-dataset.js"), "utf8");
for (const required of [
  "createRiddleSampleRecord",
  "RiddleSampleStoreEvent.WRITE",
  "exportRiddleDatasetRecords",
  "RiddleSampleMigrationEvent.CONFIRM_AND_RUN",
]) {
  if (!riddleDataset.includes(required)) {
    violations.push(`riddle-dataset.js must consume ${required}`);
  }
}

const riddleDatasetExport = fs.readFileSync(
  path.join(srcRoot, "state", "riddle-dataset-export.js"),
  "utf8"
);
for (const required of ["RiddleSampleStoreEvent.LIST", "RiddleSampleStoreEvent.DELETE_EXPORTED"]) {
  if (!riddleDatasetExport.includes(required)) {
    violations.push(`riddle-dataset-export.js must consume ${required}`);
  }
}
for (const retired of ["imageBase64", "GM_setValue(", "GM_deleteValue("]) {
  if (riddleDataset.includes(retired)) {
    violations.push(`riddle-dataset.js must retire ${retired}`);
  }
}

const riddleStore = fs.readFileSync(
  path.join(srcRoot, "state", "riddle-sample-store-indexeddb.js"),
  "utf8"
);
for (const required of [
  'const STORE_SAMPLES = "samples"',
  "StorageWriteOutcome.REJECTED_BUDGET",
  "completedRecords > budget.completedRecords",
  "bytes > budget.bytes",
  "migrationReceipts",
]) {
  if (!riddleStore.includes(required)) {
    violations.push(`riddle-sample-store-indexeddb.js must own ${required}`);
  }
}

const riddleMigration = fs.readFileSync(
  path.join(srcRoot, "state", "riddle-sample-migration.js"),
  "utf8"
);
for (const required of [
  "RIDDLE_MIGRATION_BATCH",
  "PageKind.LOBBY",
  "PageKind.ISEKAI_LOBBY",
  "PageKind.SHOWEQUIP",
  "UserFeedbackEvent.CONFIRM",
]) {
  if (!riddleMigration.includes(required)) {
    violations.push(`riddle-sample-migration.js must own ${required}`);
  }
}

const riddleMigrationExecutor = fs.readFileSync(
  path.join(srcRoot, "state", "riddle-sample-migration-executor.js"),
  "utf8"
);
for (const required of [
  "maxRecords: 8",
  "maxBytes: 8 * 1024 * 1024",
  '"copiedVerified"',
  '"sourceDeleted"',
  "recordsMatch(target, persisted)",
]) {
  if (!riddleMigrationExecutor.includes(required)) {
    violations.push(`riddle-sample-migration-executor.js must own ${required}`);
  }
}

const riddleSubmitGate = fs.readFileSync(
  path.join(srcRoot, "pages", "riddle-submit-gate.js"),
  "utf8"
);
for (const required of ["persistAttempt", 'state = "releaseNext"', "releaseSubmit()"]) {
  if (!riddleSubmitGate.includes(required)) {
    violations.push(`riddle-submit-gate.js must own ${required}`);
  }
}

for (const file of memoryFirstBattleEvidence) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  if (!text.includes("diagnosticEvidenceMemoryStorage")) {
    violations.push(`${file} must use the bounded memory-first diagnostic journal`);
  }
  if (text.includes("deps = { sessionStorage: window.sessionStorage }")) {
    violations.push(`${file} production default must not write per-event sessionStorage`);
  }
}

if (violations.length) {
  console.error("[verify-storage-io-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  `[verify-storage-io-boundary] OK - ${[...found.values()].reduce((a, b) => a + b, 0)} transitional raw writes are owned and cannot grow`
);
