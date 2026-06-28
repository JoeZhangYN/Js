import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/auto-tune.js");
const ownerTest = path.normalize("src/state/auto-tune.test.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /from\s+["'](?:\.\/|\.\.\/state\/|\.\.\/\.\.\/state\/)auto-tune\.js["']/.test(line) &&
      /\b(?:getCurrentPad|resetAutoTune|getAutoTuneStatus|observeBattle)\b/.test(line)
    ) {
      violations.push(`${where} legacy auto-tune imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.AUTO_TUNE_(?:PAD|HISTORY)\b/.test(line)
    ) {
      violations.push(`${where} auto-tune storage belongs in auto-tune`);
    }
    for (const key of ["autoTunePad", "autoTuneHistory"]) {
      if (relative !== persistKeys && line.includes(`"${key}"`)) {
        violations.push(`${where} auto-tune storage key "${key}" must use STORAGE_KEYS`);
      }
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /\bg\(\s*["']autoTunePotionCount["']/.test(line)
    ) {
      violations.push(`${where} auto-tune potion-use counter belongs in auto-tune`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runAutoTuneAutomation",
  "AutoTuneEvent",
  "STORAGE_KEYS.AUTO_TUNE_PAD",
  "STORAGE_KEYS.AUTO_TUNE_HISTORY",
  "RECORD_POTION_USE",
  "ROUND_STARTED",
  "OptionEvent.READ_FIELD",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

for (const legacy of ["getCurrentPad", "resetAutoTune", "getAutoTuneStatus", "observeBattle"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runAutoTuneAutomation(event)`
    );
  }
}

if (violations.length) {
  console.error("[verify-auto-tune-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-auto-tune-boundary] OK — auto-tune safetyPad is behind one entry");
