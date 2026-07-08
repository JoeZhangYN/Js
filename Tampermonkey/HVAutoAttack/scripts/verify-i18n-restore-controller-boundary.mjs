import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/i18n/core/restore-controller.js");
const failureOwner = path.normalize("src/i18n/core/restore-failure.js");
const ownerTest = path.normalize("src/i18n/core/restore-controller.test.js");
const fallbackTest = path.normalize("src/i18n/core/restore-failure-fallback.test.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const failureText = fs.existsSync(path.join(root, failureOwner)) ? read(failureOwner) : "";
const ownerTestText = fs.existsSync(path.join(root, ownerTest)) ? read(ownerTest) : "";

for (const required of [
  "I18N_RESTORE_FAILURE_KEY",
  "recordI18nRestoreFailure",
  'from "./restore-failure.js"',
  "registerRestore",
  "ensureRestoreButton",
  "toggleRestore",
  "registerRetranslate",
  "registerI18nRender",
  "setLang",
  "restoreCallbacks",
  "retranslateCallbacks",
  "i18nRenders",
  '"restore"',
  '"retranslate"',
  '"i18nRender"',
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}

for (const required of [
  "I18N_RESTORE_FAILURE_KEY",
  "recordI18nRestoreFailure",
  "globalThis.sessionStorage?.setItem(I18N_RESTORE_FAILURE_KEY",
  "Console hooks are diagnostic only.",
]) {
  if (!failureText.includes(required)) {
    violations.push(`${rel(failureOwner)} must own ${required}`);
  }
}

for (const forbidden of ["throw e", "throw error", "throw new Error"]) {
  if (ownerText.includes(forbidden)) {
    violations.push(`${rel(owner)} must not rethrow callback failures via ${forbidden}`);
  }
}

for (const required of [
  "I18N_RESTORE_FAILURE_KEY",
  "continues restore callbacks when one restore handler throws",
  "continues language switching when restore, retranslate, or render handlers throw",
  "keeps i18n failure evidence when diagnostic console is blocked",
  "restore failed",
  "retranslate failed",
  "restore blocked",
  "rendered",
]) {
  if (!ownerTestText.includes(required)) {
    violations.push(`${rel(ownerTest)} must cover ${required}`);
  }
}

const fallbackTestText = fs.existsSync(path.join(root, fallbackTest)) ? read(fallbackTest) : "";
for (const required of [
  "returns restore failure evidence when storage and console diagnostics both fail",
  "I18N_RESTORE_FAILURE_KEY",
  'throw new Error("quota")',
  'throw new Error("console blocked")',
  "not.toThrow()",
]) {
  if (!fallbackTestText.includes(required)) {
    violations.push(`${rel(fallbackTest)} must cover ${required}`);
  }
}

const diagnosticKeysText = read(diagnosticKeys);
for (const required of [
  'I18N_RESTORE_FAILURE: "HVAA:lastI18nRestoreFailure"',
  'source("i18nRestoreFailure", DiagnosticEvidenceKey.I18N_RESTORE_FAILURE)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${rel(diagnosticKeys)} must expose ${required}`);
  }
}

const diagnosticTestText = read(diagnosticTest);
for (const required of [
  "HVAA:lastI18nRestoreFailure",
  'i18nRestoreFailure: { capability: "i18nRestore", stage: "restore" }',
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${rel(diagnosticTest)} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-i18n-restore-controller-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-i18n-restore-controller-boundary] OK - i18n restore controller failures are isolated"
);
