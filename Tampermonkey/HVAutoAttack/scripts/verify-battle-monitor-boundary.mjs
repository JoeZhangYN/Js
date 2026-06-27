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
    for (const name of ["battleInfo", "dropMonitor", "recordUsage", "recordUsage2"]) {
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
  for (const required of [
    "battleInfo",
    "dropMonitor",
    "recordBattleReportStarted",
    "recordUsage",
    "recordUsage2",
    "readDropReport",
    "readUsageReport",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} wiring`);
    }
  }
}

walk(srcDir);
checkEntry();

if (violations.length) {
  console.error("[verify-battle-monitor-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-monitor-boundary] OK — battle monitor workflow is behind one entry");
