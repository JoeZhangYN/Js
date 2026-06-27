import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/cd-tracker.js");
const ownerTest = path.normalize("src/state/cd-tracker.test.js");
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
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.(?:GLOBAL_TURN|SKILL_LAST_USED)\b/.test(line)
    ) {
      violations.push(`${where} CD runtime persistence belongs in state/cd-tracker.js`);
    }
    if (
      relative !== owner &&
      /\b(?:getValue|setValue|delValue)\(\s*["'](?:globalTurn|skillLastUsed)["']/.test(line)
    ) {
      violations.push(`${where} CD runtime storage must use cd-tracker entry`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runCdRuntimeAutomation",
  "CdRuntimeEvent",
  "STORAGE_KEYS.GLOBAL_TURN",
  "STORAGE_KEYS.SKILL_LAST_USED",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

for (const legacy of [
  "loadCdState",
  "persistCdState",
  "incrementGlobalTurn",
  "recordFire",
  "turnsUntilReady",
  "collectCdMap",
]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runCdRuntimeAutomation(event)`
    );
  }
}

if (violations.length) {
  console.error("[verify-cd-tracker-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-cd-tracker-boundary] OK — CD runtime persistence is behind one entry");
