import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/battle/battle-round.js");
const ownerTest = path.normalize("src/battle/battle-round.test.js");
const ownerRuntimeTest = path.normalize("src/battle/battle-round-runtime.test.js");
const storage = path.normalize("src/state/storage.js");
const storageTest = path.normalize("src/state/storage.test.js");
const runtimeTest = path.normalize("src/battle/battle-runtime.test.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
const settingsRender = path.normalize("src/settings/render.js");
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== ownerRuntimeTest &&
      relative !== storage &&
      relative !== storageTest &&
      relative !== runtimeTest &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.(?:ROUND_TYPE|ROUND_NOW|ROUND_ALL)\b/.test(line)
    ) {
      violations.push(`${where} battle round state must use runBattleRoundAutomation(event)`);
    }
    if (relative === settingsRender && /setValue\(\s*input\.name\b/.test(line)) {
      violations.push(`${where} settings must not persist round debug fields directly`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (!/export function runBattleRoundAutomation\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runBattleRoundAutomation()`);
}
for (const required of [
  "READ_TYPE",
  "RECORD_TYPE",
  "RECORD_COUNT",
  "RECORD_COUNT_FROM_INITIALIZATION",
  "RECORD_START_COUNT",
  "RECORD_START_CONTEXT",
  "RECORD_DEBUG_FIELDS",
  "READ_DEBUG_FIELDS",
  "SYNC_RUNTIME",
  "READ_RUNTIME",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must expose ${required} event`);
  }
}
for (const required of ["DEFAULT_ROUND_COUNT", "normalizeRoundCount", "roundRuntime"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must internalize round count invariants`);
  }
}
if (!ownerText.includes("battleRoundEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must dispatch events through battleRoundEventHandlers`
  );
}
if (/if\s*\(\s*event\.type\s*===\s*EVENT_/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not branch directly on battle round event types`
  );
}
if ((ownerText.match(/roundRuntime\(/g) || []).length < 4) {
  violations.push(`${owner.replaceAll("\\", "/")} must normalize round count writes and reads`);
}
if (/getValue\([^)]*\)\s*\*\s*1/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not coerce round counts at read sites`);
}

const settingsText = fs.readFileSync(path.join(root, settingsRender), "utf8");
if (!settingsText.includes("BattleRoundEvent.READ_DEBUG_FIELDS")) {
  violations.push(
    `${settingsRender.replaceAll("\\", "/")} must read round debug fields through battle-round`
  );
}
if (!ownerText.includes("CLASSIFY_TYPE")) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose CLASSIFY_TYPE event`);
}
if (!ownerText.includes("randomEncounterStarted")) {
  violations.push(`${owner.replaceAll("\\", "/")} must decide random encounter start context`);
}

const newRoundText = fs.readFileSync(path.join(root, "src/battle/new-round.js"), "utf8");
if (/from\s+["']\.\.\/state\/store\.js["']/.test(newRoundText)) {
  violations.push("src/battle/new-round.js must not import raw battle runtime store");
}
if (/\bg\(\s*["']roundType["']/.test(newRoundText)) {
  violations.push("src/battle/new-round.js must not read or write roundType directly");
}
for (const forbidden of [
  /BattleRoundEvent\.(?:READ_TYPE|CLASSIFY_TYPE|RECORD_TYPE|RECORD_COUNT_FROM_INITIALIZATION|RECORD_SINGLE_ROUND)/,
  /Initializing arena challenge/,
  /Initializing random encounter/,
  /Initializing Item World/,
  /Initializing Grindfest/,
  /Initializing The Tower/,
  /\\\(Round\s+\(\\d\+\)/,
  /\broundNow\b|\broundAll\b/,
]) {
  if (forbidden.test(newRoundText)) {
    violations.push(`src/battle/new-round.js must classify round type through battle-round`);
  }
}

if (violations.length) {
  console.error("[verify-battle-round-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-round-boundary] OK — battle round state is behind one entry");
