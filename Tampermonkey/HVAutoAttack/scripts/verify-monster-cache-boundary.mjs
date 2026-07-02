import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/monster-cache.js");
const ownerTest = path.normalize("src/state/monster-cache.test.js");
const violations = [];
const legacy = ["primeMonsterCache", "getCachedMonster", "getCachedDb", "setCachedMonster"];

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
      /from\s+["'][^"']*monster-cache\.js["']/.test(line)
    ) {
      for (const name of legacy) {
        if (new RegExp(`\\b${name}\\b`).test(line)) {
          violations.push(`${where} monster cache access must use runMonsterCacheAutomation(event)`);
        }
      }
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (!/export const MonsterCacheEvent\s*=\s*Object\.freeze\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose MonsterCacheEvent`);
}
if (!/export function runMonsterCacheAutomation\(\s*event\b/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runMonsterCacheAutomation(event)`);
}
const entryBody =
  ownerText.match(/export function runMonsterCacheAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/const monsterCacheEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_PRIME_PROFILES\]/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (entryBody.includes("event.type")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must reject null events without throwing`);
}
if (!entryBody.includes("event?.type")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must fail closed for unknown or null events`);
}
for (const name of legacy) {
  if (new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${name} export must stay private behind runMonsterCacheAutomation(event)`
    );
  }
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover monster cache entry`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  if (
    !ownerTestText.includes("rejects unknown and null cache events without reading or changing cached profiles") ||
    !ownerTestText.includes("runMonsterCacheAutomation(null)") ||
    !ownerTestText.includes("runMonsterDbStoreAutomation).not.toHaveBeenCalled()")
  ) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown and null cache events`);
  }
}

if (violations.length) {
  console.error("[verify-monster-cache-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-monster-cache-boundary] OK — monster cache is behind one entry");
