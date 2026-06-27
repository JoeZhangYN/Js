import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const entry = path.normalize("src/monitor/battle-monitor-automation.js");
const internalFiles = new Set(
  [
    entry,
    "src/monitor/battle-info.js",
    "src/monitor/battle-report.js",
    "src/monitor/drop-monitor.js",
    "src/monitor/record-usage.js",
    "src/state/storage.js",
  ].map((p) => path.normalize(p))
);
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
  if (relative.endsWith(".test.js")) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (internalFiles.has(relative)) return;
    if (line.includes("runBattleMonitorAutomation") || line.includes("BattleMonitorEvent")) return;
    const where = `${rel(file)}:${index + 1}`;
    for (const name of [
      "refreshBattleHud",
      "recordBattleDrops",
      "recordBattleActionUsage",
      "recordUsage2",
    ]) {
      if (new RegExp(`\\b${name}\\s*\\(`).test(line)) {
        violations.push(`${where} ${name} belongs behind runBattleMonitorAutomation(event)`);
      }
    }
    if (
      /from\s+["'](?:\.\.\/monitor\/|\.\.\/\.\.\/monitor\/|\.\/)(battle-info|battle-report|drop-monitor|record-usage)\.js["']/.test(
        line
      )
    ) {
      violations.push(
        `${where} battle monitor internals are private; import runBattleMonitorAutomation(event)`
      );
    }
    if (
      /\b(?:getValue|setValue|delValue)\(\s*["'](?:battleCode|drop|dropOld|stats|statsOld)["']/.test(
        line
      )
    ) {
      violations.push(
        `${where} battle monitor storage belongs behind runBattleMonitorAutomation(event)`
      );
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, entry), "utf8");
  if (!/export function runBattleMonitorAutomation\(/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must expose runBattleMonitorAutomation(event)`);
  }
  if (!text.includes("recordBattleDrops")) {
    violations.push(`${entry.replaceAll("\\", "/")} must own recordBattleDrops completion wiring`);
  }
  if (!text.includes("refreshBattleHud")) {
    violations.push(`${entry.replaceAll("\\", "/")} must own refreshBattleHud HUD wiring`);
  }
  if (!text.includes("recordBattleActionUsage")) {
    violations.push(`${entry.replaceAll("\\", "/")} must own recordBattleActionUsage action-end wiring`);
  }
  for (const required of [
    "BATTLE_STARTED",
    "HUD_REFRESH",
    "ACTION_STARTED",
    "ACTION_ENDED",
    "COMPLETION_REACHED",
    "READ_DROP_REPORT",
    "READ_USAGE_REPORT",
    "CLEAR_DROP_REPORT",
    "CLEAR_USAGE_REPORT",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} event wiring`);
    }
  }
}

function checkUsageImplementation() {
  const usageFile = path.join(root, "src/monitor/record-usage.js");
  const entryText = fs.readFileSync(path.join(root, entry), "utf8");
  const text = fs.readFileSync(usageFile, "utf8");
  if (/\brecordUsage\s*\(/.test(entryText) || /\b(?:export\s+)?function\s+recordUsage\s*\(/.test(text)) {
    violations.push(
      `${rel(usageFile)} legacy recordUsage() bridge must stay deleted; use recordBattleActionUsage()`
    );
  }
  if (/\b(?:export\s+)?function\s+recordUsage2\s*\(/.test(text)) {
    violations.push(
      `${rel(usageFile)} legacy recordUsage2() bridge must stay deleted; use recordCompletedBattleUsage()`
    );
  }
}

function checkDeletedDropMonitorEntrypoint() {
  const dropFile = path.join(root, "src/monitor/drop-monitor.js");
  const entryText = fs.readFileSync(path.join(root, entry), "utf8");
  const dropText = fs.readFileSync(dropFile, "utf8");
  if (/\bdropMonitor\s*\(/.test(entryText) || /\b(?:export\s+)?function\s+dropMonitor\s*\(/.test(dropText)) {
    violations.push(`${rel(dropFile)} legacy dropMonitor() bridge must stay deleted; use recordBattleDrops()`);
  }
}

function checkDeletedBattleInfoEntrypoint() {
  const hudFile = path.join(root, "src/monitor/battle-info.js");
  const entryText = fs.readFileSync(path.join(root, entry), "utf8");
  const hudText = fs.readFileSync(hudFile, "utf8");
  if (/\bbattleInfo\s*\(/.test(entryText) || /\b(?:export\s+)?function\s+battleInfo\s*\(/.test(hudText)) {
    violations.push(`${rel(hudFile)} legacy battleInfo() bridge must stay deleted; use refreshBattleHud()`);
  }
}

walk(srcDir);
checkEntry();
checkUsageImplementation();
checkDeletedDropMonitorEntrypoint();
checkDeletedBattleInfoEntrypoint();

if (violations.length) {
  console.error("[verify-battle-monitor-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-monitor-boundary] OK — battle monitor workflow is behind one entry");
