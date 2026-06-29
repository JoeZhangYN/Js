import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const entry = path.normalize("src/battle/monster-knowledge-automation.js");
const syncImpl = path.normalize("src/battle/monster-db-sync.js");
const scanImpl = path.normalize("src/battle/monster-db-scan.js");
const scanResultImpl = path.normalize("src/battle/monster-scan-result-learning.js");
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
  for (const required of [
    "parseScanResult",
    "checkScanResultValidity",
    "MonsterStatusEvent.READ_STATUS",
    "MonsterDbStoreEvent.PROFILE_WRITE",
    "MonsterDbStoreEvent.HP_WRITE",
    "MonsterCacheEvent.WRITE_PROFILE",
  ]) {
    if (!scanResultText.includes(required)) {
      violations.push(`${scanResultImpl.replaceAll("\\", "/")} must own ${required}`);
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
