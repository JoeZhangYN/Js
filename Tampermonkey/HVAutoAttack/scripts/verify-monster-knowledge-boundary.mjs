import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const entry = path.normalize("src/battle/monster-knowledge-automation.js");
const syncImpl = path.normalize("src/battle/monster-db-sync.js");
const scanImpl = path.normalize("src/battle/monster-db-scan.js");
const panelImpl = path.normalize("src/monitor/monster-resist-panel.js");
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
  const allowed = new Set([entry, syncImpl, scanImpl, panelImpl]);
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (allowed.has(relative)) return;
    const where = `${rel(file)}:${index + 1}`;
    for (const name of ["syncMonsterDb", "setupScanWatch", "renderResistPanel"]) {
      if (new RegExp(`\\b${name}\\b`).test(line)) {
        violations.push(
          `${where} ${name} belongs behind runMonsterKnowledgeAutomation(event)`
        );
      }
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, entry), "utf8");
  if (!/export function runMonsterKnowledgeAutomation\(/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must expose runMonsterKnowledgeAutomation(event)`);
  }
  for (const required of ["syncMonsterDb", "setupScanWatch", "renderResistPanel"]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} wiring`);
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

console.log("[verify-monster-knowledge-boundary] OK — monster knowledge workflow is behind one entry");
