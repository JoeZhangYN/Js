import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDirs = ["src/battle", "src/pages"].map((p) => path.join(root, p));
const entry = path.normalize("src/monitor/battle-monitor-automation.js");
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
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (line.includes("runBattleMonitorAutomation") || line.includes("BattleMonitorEvent")) return;
    const where = `${rel(file)}:${index + 1}`;
    for (const name of ["battleInfo", "dropMonitor", "recordUsage", "recordUsage2"]) {
      if (new RegExp(`\\b${name}\\b`).test(line)) {
        violations.push(
          `${where} ${name} belongs behind runBattleMonitorAutomation(event)`
        );
      }
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, entry), "utf8");
  if (!/export function runBattleMonitorAutomation\(/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must expose runBattleMonitorAutomation(event)`);
  }
  for (const required of ["battleInfo", "dropMonitor", "recordUsage", "recordUsage2"]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} wiring`);
    }
  }
}

for (const dir of srcDirs) walk(dir);
checkEntry();

if (violations.length) {
  console.error("[verify-battle-monitor-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-monitor-boundary] OK — battle monitor workflow is behind one entry");
