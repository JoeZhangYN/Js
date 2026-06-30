import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/monster-db-store.js");
const ownerTest = path.normalize("src/state/monster-db-store.test.js");
const violations = [];
const legacy = [
  "getMonsterById",
  "setMonsterById",
  "bulkSetMonsters",
  "isProfileEmpty",
  "getMonsterHp",
  "setMonsterHp",
  "getMeta",
  "setMeta",
];

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
      /from\s+["'][^"']*monster-db-store\.js["']/.test(line)
    ) {
      for (const name of legacy) {
        if (new RegExp(`\\b${name}\\b`).test(line)) {
          violations.push(`${where} monster db store IO must use runMonsterDbStoreAutomation(event)`);
        }
      }
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
if (!/export const MonsterDbStoreEvent\s*=\s*Object\.freeze\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose MonsterDbStoreEvent`);
}
if (!/export function runMonsterDbStoreAutomation\(\s*event\b/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runMonsterDbStoreAutomation(event)`);
}
const entryBody =
  ownerText.match(/export function runMonsterDbStoreAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/const monsterDbStoreEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_PROFILE_READ\]/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
for (const name of legacy) {
  if (new RegExp(`export\\s+function\\s+${name}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${name} export must stay private behind runMonsterDbStoreAutomation(event)`
    );
  }
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover monster db store entry`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  if (!ownerTestText.includes("rejects unknown store events without changing persisted profiles")) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown store events`);
  }
}

if (violations.length) {
  console.error("[verify-monster-db-store-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-monster-db-store-boundary] OK — monster db store IO is behind one entry");
