import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/state/storage.js");
const ownerTest = path.normalize("src/state/storage.test.js");
const violations = [];

function rel(file) {
  return path.normalize(file).replaceAll("\\", "/");
}

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "warnStorageReadFailure",
  "STORAGE_READ_FAILURE_KEY",
  "HVAA:lastStorageReadFailure",
  "[HVAA] storage read failed",
  "parseLocalStorageValue",
  "localStorageJson",
  "GM_getValue",
  "sessionStorage?.setItem",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own storage read failure ${required}`);
  }
}
if (!/catch\s*\(error\)\s*\{[\s\S]*warnStorageReadFailure\(item,\s*key,\s*"GM_getValue"/.test(ownerText)) {
  violations.push(`${rel(owner)} must classify GM_getValue read failures`);
}
if (!/catch\s*\(error\)\s*\{[\s\S]*warnStorageReadFailure\(item,\s*key,\s*"localStorageJson"/.test(ownerText)) {
  violations.push(`${rel(owner)} must classify corrupted localStorage JSON`);
}

if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover storage behavior`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  for (const required of [
    "fails closed and records evidence for corrupted localStorage JSON",
    "falls back to localStorage when GM_getValue throws",
    "fails closed when storage read diagnostics cannot be written or warned",
    "STORAGE_READ_FAILURE_KEY",
    "HVAA:lastStorageReadFailure",
    "console blocked",
    "session blocked",
    "[HVAA] storage read failed",
    "localStorageJson",
    "GM_getValue",
  ]) {
    if (!ownerTestText.includes(required)) {
      violations.push(`${rel(ownerTest)} must cover ${required}`);
    }
  }
}

if (violations.length) {
  console.error("[verify-storage-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-storage-boundary] OK - storage read failures fail closed");
