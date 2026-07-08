import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/auto-tune.js");
const ownerTest = path.normalize("src/state/auto-tune.test.js");
const failureTest = path.normalize("src/state/auto-tune-failure.test.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
const roundStart = path.normalize("src/battle/battle-round-start.js");
const roundLifecycle = path.normalize("src/battle/round-lifecycle.js");
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
      relative !== failureTest &&
      /from\s+["'](?:\.\/|\.\.\/state\/|\.\.\/\.\.\/state\/)auto-tune\.js["']/.test(line) &&
      /\b(?:getCurrentPad|resetAutoTune|getAutoTuneStatus|observeBattle)\b/.test(line)
    ) {
      violations.push(`${where} legacy auto-tune imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== failureTest &&
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
      relative !== failureTest &&
      /\bg\(\s*["']autoTunePotionCount["']/.test(line)
    ) {
      violations.push(`${where} auto-tune potion-use counter belongs in auto-tune`);
    }
    if (relative === ownerTest && /\bg\(\s*["']option["']/.test(line)) {
      violations.push(
        `${where} auto-tune tests must seed option through runOptionAutomation(event)`
      );
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
const roundStartText = fs.readFileSync(path.join(root, roundStart), "utf8");
const roundLifecycleText = fs.readFileSync(path.join(root, roundLifecycle), "utf8");
const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
const failureTestText = fs.readFileSync(path.join(root, failureTest), "utf8");
for (const required of [
  "runAutoTuneAutomation",
  "AutoTuneEvent",
  "autoTuneEventHandlers",
  "AUTO_TUNE_FAILURE_KEY",
  "recordAutoTuneFailure",
  "persistAutoTuneValue",
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

if (/AutoTuneEvent\.ROUND_STARTED|runAutoTuneAutomation/.test(roundStartText)) {
  violations.push(`${roundStart.replaceAll("\\", "/")} must use round lifecycle entry`);
}
if (!roundLifecycleText.includes("AutoTuneEvent.ROUND_STARTED")) {
  violations.push(`${roundLifecycle.replaceAll("\\", "/")} must own round-start auto-tune`);
}

if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must dispatch events through handler table`);
}
const ownerEntry = ownerText.match(/export function runAutoTuneAutomation[\s\S]*?\n}/)?.[0] || "";
if (/\bevent\.type\b/.test(ownerEntry) || !/\bevent\?\.type\b/.test(ownerEntry)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must fail closed for null auto-tune events`
  );
}
if (!/runAutoTuneAutomation\(null\)/.test(ownerTestText)) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null auto-tune events`);
}

if (
  !/function persistAutoTuneValue[\s\S]*setValue\(storageKey,\s*value\);[\s\S]*return true;[\s\S]*catch\s*\(error\)\s*{[\s\S]*recordAutoTuneFailure\(stage,\s*storageKey,\s*error\);[\s\S]*return false;/.test(
    ownerText
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} must classify auto-tune storage write failures`);
}
if ((ownerText.match(/\bsetValue\(/g) || []).length !== 1) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route auto-tune writes through persistAutoTuneValue`
  );
}
if (!ownerText.includes("return maybeStep(history, pad, key);")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must report pad-step persistence failures from RECORD_BATTLE`
  );
}
for (const required of [
  "AUTO_TUNE_FAILURE_KEY",
  "record-history",
  "explore-lower-pad",
  "does not report auto-tune step success when pad persistence fails",
  "pad write blocked",
  "storageWrite",
  "auto-tune write blocked",
]) {
  if (!failureTestText.includes(required)) {
    violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
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
