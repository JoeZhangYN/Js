import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/monster-db-store.js");
const ownerTest = path.normalize("src/state/monster-db-store.test.js");
const failureEvidenceTest = path.normalize("src/state/monster-db-store-failure-evidence.test.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
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
          violations.push(
            `${where} monster db store IO must use runMonsterDbStoreAutomation(event)`
          );
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
if (
  !/const monsterDbStoreEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_PROFILE_READ\]/.test(
    ownerText
  )
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route events through a frozen handler table`
  );
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (entryBody.includes("event.type")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must reject null events without throwing`);
}
if (!entryBody.includes("event?.type")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must fail closed for unknown or null events`
  );
}
for (const name of legacy) {
  if (new RegExp(`export\\s+function\\s+${name}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${name} export must stay private behind runMonsterDbStoreAutomation(event)`
    );
  }
}
for (const required of [
  "MONSTER_DB_STORE_FAILURE_KEY",
  "HVAA:lastMonsterDbStoreFailure",
  "classifyDbError",
  "rejectDbFailure",
  'capability: "monsterDbStore"',
  "sessionStorage.setItem(MONSTER_DB_STORE_FAILURE_KEY",
  "[HVAA] monster db store failed",
  "IndexedDB failure rejection must not depend on diagnostic storage.",
  "Console hooks must not replace the classified IndexedDB failure.",
  "transaction-start",
  "transaction-error",
  "transaction-abort",
  "dbPromise = null",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own IndexedDB failure ${required}`);
  }
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover monster db store entry`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  if (
    !ownerTestText.includes(
      "rejects unknown and null store events without reading or changing persisted profiles"
    ) ||
    !ownerTestText.includes("runMonsterDbStoreAutomation(null)") ||
    !ownerTestText.includes("does not open IndexedDB for unknown or null store events")
  ) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown and null store events`);
  }
  for (const required of [
    "classifies IndexedDB open failures and allows a later open retry",
    "classifies transaction start failures",
    "classifies transaction abort failures",
    "[HVAA] monster db store failed",
    "transaction-start",
    "transaction-abort",
    'source: "monsterDbStore"',
  ]) {
    if (!ownerTestText.includes(required)) {
      violations.push(`${ownerTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
}
if (!fs.existsSync(path.join(root, failureEvidenceTest))) {
  violations.push(
    `${failureEvidenceTest.replaceAll("\\", "/")} must cover persisted failure evidence`
  );
} else {
  const failureEvidenceTestText = fs.readFileSync(path.join(root, failureEvidenceTest), "utf8");
  for (const required of [
    "persists classified IndexedDB failures",
    "keeps classified IndexedDB rejection when diagnostics are blocked",
    "MONSTER_DB_STORE_FAILURE_KEY",
    "HVAA:lastMonsterDbStoreFailure",
    "session blocked",
    "console blocked",
    'capability: "monsterDbStore"',
  ]) {
    if (!failureEvidenceTestText.includes(required)) {
      violations.push(`${failureEvidenceTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
}

const diagnosticKeysText = fs.readFileSync(path.join(root, diagnosticKeys), "utf8");
for (const required of [
  'MONSTER_DB_STORE_FAILURE: "HVAA:lastMonsterDbStoreFailure"',
  'source("monsterDbStoreFailure", DiagnosticEvidenceKey.MONSTER_DB_STORE_FAILURE)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${diagnosticKeys.replaceAll("\\", "/")} must expose ${required}`);
  }
}

const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
for (const required of [
  "HVAA:lastMonsterDbStoreFailure",
  "monsterDbStoreFailure",
  "monsterDbStore",
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${diagnosticTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-monster-db-store-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-monster-db-store-boundary] OK — monster db store IO is behind one entry");
