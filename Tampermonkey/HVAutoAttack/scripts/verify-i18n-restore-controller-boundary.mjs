import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/i18n/core/restore-controller.js");
const ownerTest = path.normalize("src/i18n/core/restore-controller.test.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const ownerTestText = fs.existsSync(path.join(root, ownerTest)) ? read(ownerTest) : "";

for (const required of [
  "registerRestore",
  "ensureRestoreButton",
  "toggleRestore",
  "registerRetranslate",
  "registerI18nRender",
  "setLang",
  "restoreCallbacks",
  "retranslateCallbacks",
  "i18nRenders",
  'console.error("[HVAA][i18n] restore 回调出错:"',
  'console.error("[HVAA][i18n] retranslate 回调出错:"',
  'console.error("[HVAA][i18n] i18nRender 出错:"',
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}

for (const forbidden of ["throw e", "throw error", "throw new Error"]) {
  if (ownerText.includes(forbidden)) {
    violations.push(`${rel(owner)} must not rethrow callback failures via ${forbidden}`);
  }
}

for (const required of [
  "continues restore callbacks when one restore handler throws",
  "continues language switching when restore, retranslate, or render handlers throw",
  "restore failed",
  "retranslate failed",
  "rendered",
]) {
  if (!ownerTestText.includes(required)) {
    violations.push(`${rel(ownerTest)} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-i18n-restore-controller-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-i18n-restore-controller-boundary] OK - i18n restore controller failures are isolated");
