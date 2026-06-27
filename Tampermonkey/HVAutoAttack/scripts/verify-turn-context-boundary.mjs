import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src/battle");
const entry = path.normalize("src/battle/turn-context.js");
const snapshotImpl = path.normalize("src/battle/snapshot.js");
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
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (relative === entry || relative === snapshotImpl) return;
    const where = `${rel(file)}:${index + 1}`;
    for (const name of [
      "CdRuntimeEvent.INCREMENT_TURN",
      "CdRuntimeEvent.PERSIST",
      "collectSnapshot",
      "assertNoDomRefs",
    ]) {
      if (new RegExp(`\\b${name}\\b`).test(line)) {
        violations.push(`${where} ${name} belongs behind prepareBattleTurnContext()`);
      }
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, entry), "utf8");
  if (!/export function prepareBattleTurnContext\(/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must expose prepareBattleTurnContext()`);
  }
  for (const required of [
    "runCdRuntimeAutomation",
    "CdRuntimeEvent.INCREMENT_TURN",
    "CdRuntimeEvent.PERSIST",
    "collectSnapshot",
    "assertNoDomRefs",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} wiring`);
    }
  }
}

walk(srcDir);
checkEntry();

if (violations.length) {
  console.error("[verify-turn-context-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-turn-context-boundary] OK — battle turn context is behind one entry");
