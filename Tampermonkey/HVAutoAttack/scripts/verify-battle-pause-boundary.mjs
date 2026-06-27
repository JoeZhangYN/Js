import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const entry = path.normalize("src/battle/pause-automation.js");
const bridge = path.normalize("src/battle/pause-control.js");
const storage = path.normalize("src/state/storage.js");
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
    const where = `${rel(file)}:${index + 1}`;
    if (/\bpauseChange\s*\(/.test(line) || /\bimport\b.*\bpauseChange\b/.test(line)) {
      violations.push(`${where} legacy pauseChange path is forbidden`);
    }
    if (
      relative !== entry &&
      relative !== bridge &&
      /\bpauseScript\b/.test(line)
    ) {
      violations.push(`${where} pauseScript bridge is internal; use runBattlePauseAutomation(event)`);
    }
    if (
      relative !== entry &&
      relative !== storage &&
      /\b(?:setValue|getValue|delValue)\(\s*["']disabled["']/.test(line)
    ) {
      violations.push(`${where} disabled state belongs in runBattlePauseAutomation(event)`);
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, entry), "utf8");
  if (!/export function runBattlePauseAutomation\(/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must expose runBattlePauseAutomation(event)`);
  }
  for (const required of ["setValue(\"disabled\"", "getValue(\"disabled\"", "delValue(0)"]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} pause wiring`);
    }
  }
}

walk(srcDir);
checkEntry();

if (violations.length) {
  console.error("[verify-battle-pause-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-pause-boundary] OK — battle pause workflow is behind one entry");
