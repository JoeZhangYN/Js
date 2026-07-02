import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const entry = path.normalize("src/battle/monster-knowledge-automation.js");
const syncImpl = path.normalize("src/battle/monster-db-sync.js");
const scanImpl = path.normalize("src/battle/monster-db-scan.js");
const scanResultImpl = path.normalize("src/battle/monster-scan-result-learning.js");
const persistenceEvidenceTest = path.normalize(
  "src/battle/monster-knowledge-persistence-evidence.test.js"
);
const panelImpl = path.normalize("src/monitor/monster-resist-panel.js");
const panelModelImpl = path.normalize("src/monitor/monster-resist-panel-model.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (item.isFile() && item.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const allowed = new Set([entry, syncImpl, scanImpl, scanResultImpl, panelImpl, panelModelImpl]);
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (allowed.has(relative)) return;
    const where = `${rel(file)}:${index + 1}`;
    for (const name of ["syncMonsterDb", "startMonsterScanLearning", "renderResistPanel"]) {
      if (new RegExp(`\\b${name}\\b`).test(line)) {
        violations.push(`${where} ${name} belongs behind runMonsterKnowledgeAutomation(event)`);
      }
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, entry), "utf8");
  if (!/export function runMonsterKnowledgeAutomation\(/.test(text)) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must expose runMonsterKnowledgeAutomation(event)`
    );
  }
  if (!/const monsterKnowledgeEventHandlers\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must route events through one table`);
  }
  if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must not route events through an if ladder`);
  }
  const entryBody =
    text.match(/export function runMonsterKnowledgeAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/monsterKnowledgeEventHandlers\[event\.type\]/.test(entryBody)) {
    violations.push(`${entry.replaceAll("\\", "/")} entry must fail closed for invalid knowledge events`);
  }
  if (!/monsterKnowledgeEventHandlers\[event\?\.type\]/.test(entryBody)) {
    violations.push(
      `${entry.replaceAll("\\", "/")} entry must dispatch invalid knowledge events through optional type`
    );
  }
  const entryTest = path.normalize("src/battle/monster-knowledge-automation.test.js");
  const entryTestText = fs.existsSync(path.join(root, entryTest))
    ? fs.readFileSync(path.join(root, entryTest), "utf8")
    : "";
  if (!/runMonsterKnowledgeAutomation\(null\)/.test(entryTestText)) {
    violations.push(`${entryTest.replaceAll("\\", "/")} must cover null knowledge events`);
  }
  for (const required of [
    "runMonsterDbSyncAutomation",
    "MonsterDbSyncEvent.SYNC_REQUESTED",
    "runMonsterScanLearningAutomation",
    "MonsterScanLearningEvent.START",
    "runMonsterResistPanelAutomation",
    "MonsterResistPanelEvent.REFRESH",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} wiring`);
    }
  }
  if (/\brenderResistPanel\b/.test(text)) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must use monster resist panel event entry, not renderResistPanel()`
    );
  }
  if (/\bsyncMonsterDb\b/.test(text)) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must use monster db sync event entry, not syncMonsterDb()`
    );
  }
  if (/\bstartMonsterScanLearning\b/.test(text)) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must use monster scan learning event entry, not startMonsterScanLearning()`
    );
  }
  const syncText = fs.readFileSync(path.join(root, syncImpl), "utf8");
  if (!/export const MonsterDbSyncEvent\s*=\s*Object\.freeze\(/.test(syncText)) {
    violations.push(`${syncImpl.replaceAll("\\", "/")} must expose MonsterDbSyncEvent`);
  }
  if (!/export function runMonsterDbSyncAutomation\(/.test(syncText)) {
    violations.push(
      `${syncImpl.replaceAll("\\", "/")} must expose runMonsterDbSyncAutomation(event)`
    );
  }
  if (!/const monsterDbSyncEventHandlers\s*=\s*Object\.freeze\(/.test(syncText)) {
    violations.push(`${syncImpl.replaceAll("\\", "/")} must route events through one table`);
  }
  if (/if\s*\(\s*event\.type\s*!==\s*EVENT_SYNC_REQUESTED/.test(syncText)) {
    violations.push(
      `${syncImpl.replaceAll("\\", "/")} must not route sync events through an if ladder`
    );
  }
  const syncEntryBody =
    syncText.match(/export function runMonsterDbSyncAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/monsterDbSyncEventHandlers\[event\.type\]/.test(syncEntryBody)) {
    violations.push(`${syncImpl.replaceAll("\\", "/")} entry must fail closed for invalid sync events`);
  }
  if (!/monsterDbSyncEventHandlers\[event\?\.type\]/.test(syncEntryBody)) {
    violations.push(
      `${syncImpl.replaceAll("\\", "/")} entry must dispatch invalid sync events through optional type`
    );
  }
  const syncTest = path.normalize("src/battle/monster-db-sync.test.js");
  const syncTestText = fs.readFileSync(path.join(root, syncTest), "utf8");
  if (!/runMonsterDbSyncAutomation\(null/.test(syncTestText)) {
    violations.push(`${syncTest.replaceAll("\\", "/")} must cover null sync events`);
  }
  for (const required of [
    "classifySyncFailure",
    "syncRejected",
    "store-profiles",
    "write-meta",
    "request-start",
    "failure.cause",
  ]) {
    if (!syncText.includes(required)) {
      violations.push(`${syncImpl.replaceAll("\\", "/")} must preserve sync failure ${required}`);
    }
  }
  const syncFailureTest = path.normalize("src/battle/monster-db-sync-failure.test.js");
  const syncFailureText = fs.existsSync(path.join(root, syncFailureTest))
    ? fs.readFileSync(path.join(root, syncFailureTest), "utf8")
    : "";
  for (const required of [
    "classifies malformed upstream data as parse failure",
    "classifies profile store failures with downstream cause evidence",
    "classifies meta write failures separately from profile writes",
    "classifies request start failures without throwing from sync entry",
  ]) {
    if (!syncFailureText.includes(required)) {
      violations.push(`${syncFailureTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
  if (/export\s+async\s+function\s+syncMonsterDb\(/.test(syncText)) {
    violations.push(
      `${syncImpl.replaceAll("\\", "/")} must keep syncMonsterDb private behind runMonsterDbSyncAutomation(event)`
    );
  }
  const panelText = fs.readFileSync(path.join(root, panelImpl), "utf8");
  if (!/export const MonsterResistPanelEvent\s*=\s*Object\.freeze\(/.test(panelText)) {
    violations.push(`${panelImpl.replaceAll("\\", "/")} must expose MonsterResistPanelEvent`);
  }
  if (!/export function runMonsterResistPanelAutomation\(/.test(panelText)) {
    violations.push(
      `${panelImpl.replaceAll("\\", "/")} must expose runMonsterResistPanelAutomation(event)`
    );
  }
  if (/export\s+async\s+function\s+renderResistPanel\(/.test(panelText)) {
    violations.push(
      `${panelImpl.replaceAll("\\", "/")} must keep renderResistPanel private behind runMonsterResistPanelAutomation(event)`
    );
  }
  if (!panelText.includes("runMonsterResistPanelModel")) {
    violations.push(`${panelImpl.replaceAll("\\", "/")} must render rows from panel model entry`);
  }
  for (const forbidden of [
    "MonsterStatusEvent.READ_IDS_BY_ORDER",
    "MonsterCacheEvent",
    "runMonsterCacheAutomation",
    "readProfile",
    "primeProfiles",
  ]) {
    if (panelText.includes(forbidden)) {
      violations.push(`${panelImpl.replaceAll("\\", "/")} must not assemble resist model directly`);
    }
  }
  const panelModelText = fs.readFileSync(path.join(root, panelModelImpl), "utf8");
  if (!/export const MonsterResistPanelModelEvent\s*=\s*Object\.freeze\(/.test(panelModelText)) {
    violations.push(`${panelModelImpl.replaceAll("\\", "/")} must expose event constants`);
  }
  if (!/export function runMonsterResistPanelModel\(/.test(panelModelText)) {
    violations.push(`${panelModelImpl.replaceAll("\\", "/")} must expose one model entry`);
  }
  for (const required of [
    "MonsterStatusEvent.READ_IDS_BY_ORDER",
    "MonsterCacheEvent.PRIME_PROFILES",
    "MonsterCacheEvent.READ_PROFILE",
    "readMonsterIdByOrder",
  ]) {
    if (!panelModelText.includes(required)) {
      violations.push(`${panelModelImpl.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  const scanText = fs.readFileSync(path.join(root, scanImpl), "utf8");
  if (!/export const MonsterScanLearningEvent\s*=\s*Object\.freeze\(/.test(scanText)) {
    violations.push(`${scanImpl.replaceAll("\\", "/")} must expose MonsterScanLearningEvent`);
  }
  if (!/export function runMonsterScanLearningAutomation\(/.test(scanText)) {
    violations.push(
      `${scanImpl.replaceAll("\\", "/")} must expose runMonsterScanLearningAutomation(event)`
    );
  }
  if (!/const monsterScanLearningEventHandlers\s*=\s*Object\.freeze\(/.test(scanText)) {
    violations.push(`${scanImpl.replaceAll("\\", "/")} must route events through one table`);
  }
  if (/if\s*\(\s*event\.type\s*!==\s*EVENT_START/.test(scanText)) {
    violations.push(
      `${scanImpl.replaceAll("\\", "/")} must not route scan events through an if ladder`
    );
  }
  const scanEntryBody =
    scanText.match(/export function runMonsterScanLearningAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/monsterScanLearningEventHandlers\[event\.type\]/.test(scanEntryBody)) {
    violations.push(`${scanImpl.replaceAll("\\", "/")} entry must fail closed for invalid scan learning events`);
  }
  if (!/monsterScanLearningEventHandlers\[event\?\.type\]/.test(scanEntryBody)) {
    violations.push(
      `${scanImpl.replaceAll("\\", "/")} entry must dispatch invalid scan learning events through optional type`
    );
  }
  const scanTest = path.normalize("src/battle/monster-db-scan.test.js");
  const scanTestText = fs.readFileSync(path.join(root, scanTest), "utf8");
  if (!/runMonsterScanLearningAutomation\(null/.test(scanTestText)) {
    violations.push(`${scanTest.replaceAll("\\", "/")} must cover null scan learning events`);
  }
  if (/export\s+function\s+startMonsterScanLearning\(/.test(scanText)) {
    violations.push(
      `${scanImpl.replaceAll("\\", "/")} must keep startMonsterScanLearning private behind runMonsterScanLearningAutomation(event)`
    );
  }
  if (/\bsetupScanWatch\b/.test(text) || /\bsetupScanWatch\b/.test(scanText)) {
    violations.push("monster scan learning must not use legacy setupScanWatch entrypoint");
  }
  if (!scanText.includes("runMonsterScanResultLearning")) {
    violations.push(
      `${scanImpl.replaceAll("\\", "/")} must delegate scan row business decisions to scan result entry`
    );
  }
  for (const forbidden of [
    "parseScanResult",
    "checkScanResultValidity",
    "MonsterDbStoreEvent",
    "MonsterCacheEvent",
    "MonsterStatusEvent.READ_STATUS",
    "runTimeAutomation",
    "storeProfile",
    "storeHp",
  ]) {
    if (scanText.includes(forbidden)) {
      violations.push(`${scanImpl.replaceAll("\\", "/")} must stay a DOM observer shell`);
    }
  }
  const scanResultText = fs.readFileSync(path.join(root, scanResultImpl), "utf8");
  if (!/export const MonsterScanResultLearningEvent\s*=\s*Object\.freeze\(/.test(scanResultText)) {
    violations.push(`${scanResultImpl.replaceAll("\\", "/")} must expose event constants`);
  }
  if (!/export function runMonsterScanResultLearning\(/.test(scanResultText)) {
    violations.push(`${scanResultImpl.replaceAll("\\", "/")} must expose one scan result entry`);
  }
  if (!/const monsterScanResultEventHandlers\s*=\s*Object\.freeze\(/.test(scanResultText)) {
    violations.push(`${scanResultImpl.replaceAll("\\", "/")} must route events through one table`);
  }
  if (/if\s*\(\s*event\.type\s*===\s*EVENT_RECORD_LOG_ROW/.test(scanResultText)) {
    violations.push(
      `${scanResultImpl.replaceAll("\\", "/")} must not route scan result events through an if ladder`
    );
  }
  const scanResultEntryBody =
    scanResultText.match(/export function runMonsterScanResultLearning\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/monsterScanResultEventHandlers\[event\.type\]/.test(scanResultEntryBody)) {
    violations.push(`${scanResultImpl.replaceAll("\\", "/")} entry must fail closed for invalid scan result events`);
  }
  if (!/monsterScanResultEventHandlers\[event\?\.type\]/.test(scanResultEntryBody)) {
    violations.push(
      `${scanResultImpl.replaceAll("\\", "/")} entry must dispatch invalid scan result events through optional type`
    );
  }
  const scanResultTest = path.normalize("src/battle/monster-scan-result-learning.test.js");
  const scanResultTestText = fs.readFileSync(path.join(root, scanResultTest), "utf8");
  if (!/runMonsterScanResultLearning\(null/.test(scanResultTestText)) {
    violations.push(`${scanResultTest.replaceAll("\\", "/")} must cover null scan result events`);
  }
  for (const required of [
    "parseScanResult",
    "checkScanResultValidity",
    "MonsterStatusEvent.READ_STATUS",
    "MonsterDbStoreEvent.PROFILE_WRITE",
    "MonsterDbStoreEvent.HP_WRITE",
    "MonsterCacheEvent.WRITE_PROFILE",
    "recordMonsterKnowledgePersistenceFailure",
    "scan-store-profile",
    "scan-cache-profile",
    "scan-store-hp",
  ]) {
    if (!scanResultText.includes(required)) {
      violations.push(`${scanResultImpl.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  const scanResultFailureTest = path.normalize("src/battle/monster-scan-result-learning-failure.test.js");
  const scanResultFailureText = fs.existsSync(path.join(root, scanResultFailureTest))
    ? fs.readFileSync(path.join(root, scanResultFailureTest), "utf8")
    : "";
  for (const required of [
    "records profile store failures without claiming scan stored",
    "records cache and HP store failures after profile storage succeeds",
  ]) {
    if (!scanResultFailureText.includes(required)) {
      violations.push(`${scanResultFailureTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
  if (!scanResultText.includes("MonsterStatusEvent.READ_STATUS")) {
    violations.push(
      `${scanResultImpl.replaceAll("\\", "/")} must resolve scan identity through monster status entry`
    );
  }
  if (/\bg\(\s*["']monsterStatus["']/.test(scanText + scanResultText)) {
    violations.push(`monster scan learning must not read monsterStatus directly`);
  }
  const persistenceEvidenceTestText = fs.existsSync(path.join(root, persistenceEvidenceTest))
    ? fs.readFileSync(path.join(root, persistenceEvidenceTest), "utf8")
    : "";
  for (const required of [
    "returns persistence failure evidence when storage and warning diagnostics both fail",
    'throw new Error("quota")',
    'throw new Error("console blocked")',
    "not.toThrow()",
    "scan-cache-profile",
  ]) {
    if (!persistenceEvidenceTestText.includes(required)) {
      violations.push(`${persistenceEvidenceTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
}

walk(srcDir);
checkEntry();

if (violations.length) {
  console.error("[verify-monster-knowledge-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-monster-knowledge-boundary] OK — monster knowledge workflow is behind one entry"
);
