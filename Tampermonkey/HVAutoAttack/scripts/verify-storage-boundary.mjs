import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/state/storage.js");
const ownerTest = path.normalize("src/state/storage.test.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
const violations = [];

function rel(file) {
  return path.normalize(file).replaceAll("\\", "/");
}

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "createStorageCapability",
  "CURRENT_WORLD_POLICY.storage",
  "warnReadFailure",
  'capability: "storageRead"',
  "STORAGE_READ_FAILURE_KEY",
  "HVAA:lastStorageReadFailure",
  "[HVAA] storage read failed",
  "DiagnosticConsoleEvent.WARN",
  "runDiagnosticConsoleAutomation",
  "JSON.parse(raw)",
  "localStorageJson",
  "GM_getValue",
  "gmValue !== undefined",
  "sessionStorage?.setItem",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own storage read failure ${required}`);
  }
}
if (/\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(ownerText)) {
  violations.push(`${rel(owner)} storage diagnostics must use the typed diagnostic console entry`);
}
for (const required of ["setValue('option') 写入缺 version 字段", "runOptionAutomation(event)"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must keep incomplete option write advisory ${required}`);
  }
}
if (!/catch\s*\(error\)\s*\{[\s\S]*warnReadFailure\(item,\s*key,\s*"GM_getValue"/.test(ownerText)) {
  violations.push(`${rel(owner)} must classify GM_getValue read failures`);
}
if (
  !/catch\s*\(error\)\s*\{[\s\S]*warnReadFailure\(item,\s*key,\s*"localStorageJson"/.test(ownerText)
) {
  violations.push(`${rel(owner)} must classify corrupted localStorage JSON`);
}

if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover storage behavior`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  for (const required of [
    "routes incomplete option write advisories through typed diagnostics",
    "fails closed and records evidence for corrupted localStorage JSON",
    "falls back to localStorage when GM_getValue throws",
    "preserves an authoritative GM %s value over stale local storage",
    "uses local storage only when the GM key is absent",
    "fails closed when storage read evidence and diagnostic console both fail",
    'capability: "storageRead"',
    "STORAGE_READ_FAILURE_KEY",
    "HVAA:lastStorageReadFailure",
    "runDiagnosticConsoleAutomation",
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

const diagnosticKeysText = fs.readFileSync(path.join(root, diagnosticKeys), "utf8");
for (const required of [
  'STORAGE_READ_FAILURE: "HVAA:lastStorageReadFailure"',
  'source("storageReadFailure", DiagnosticEvidenceKey.STORAGE_READ_FAILURE)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${rel(diagnosticKeys)} must expose ${required}`);
  }
}
const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
for (const required of [
  "HVAA:lastStorageReadFailure",
  'storageReadFailure: { capability: "storageRead", source: "GM_getValue" }',
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${rel(diagnosticTest)} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-storage-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-storage-boundary] OK - storage read failures fail closed");
