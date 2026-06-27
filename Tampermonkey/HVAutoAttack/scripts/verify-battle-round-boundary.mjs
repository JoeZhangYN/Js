import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/battle/battle-round.js");
const ownerTest = path.normalize("src/battle/battle-round.test.js");
const storage = path.normalize("src/state/storage.js");
const storageTest = path.normalize("src/state/storage.test.js");
const runtimeTest = path.normalize("src/battle/battle-runtime.test.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
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
      relative !== storage &&
      relative !== storageTest &&
      relative !== runtimeTest &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.(?:ROUND_TYPE|ROUND_NOW|ROUND_ALL)\b/.test(line)
    ) {
      violations.push(`${where} battle round state must use runBattleRoundAutomation(event)`);
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
  "SYNC_RUNTIME",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must expose ${required} event`);
  }
}
if (!ownerText.includes("CLASSIFY_TYPE")) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose CLASSIFY_TYPE event`);
}

const newRoundText = fs.readFileSync(path.join(root, "src/battle/new-round.js"), "utf8");
for (const forbidden of [
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
