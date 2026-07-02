import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const helper = path.normalize("src/i18n/core/init-failure.js");
const helperTest = path.normalize("src/i18n/core/init-failure.test.js");
const entries = [
  [path.normalize("src/i18n/jpx-lang.js"), "jpx"],
  [path.normalize("src/i18n/interface-translate.js"), "interface"],
  [path.normalize("src/i18n/equip-translate.js"), "equip"],
];
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const helperText = read(helper);
for (const required of [
  "I18N_INIT_FAILURE_KEY",
  "recordI18nInitFailure",
  "globalThis.sessionStorage?.setItem(I18N_INIT_FAILURE_KEY",
  "Console hooks are diagnostic only.",
]) {
  if (!helperText.includes(required)) violations.push(`${rel(helper)} must own ${required}`);
}

for (const [entry, name] of entries) {
  const text = read(entry);
  if (!text.includes('from "./core/init-failure.js"')) {
    violations.push(`${rel(entry)} must import i18n init failure recorder`);
  }
  if (!text.includes(`recordI18nInitFailure("${name}", e)`)) {
    violations.push(`${rel(entry)} must classify ${name} init failures`);
  }
  if (/console\.error\(\s*["']\[HVAA\]\[(?:jpx|ui|equip)-i18n\]/.test(text)) {
    violations.push(`${rel(entry)} must not keep legacy init console-only failure handling`);
  }
}

const helperTestText = read(helperTest);
for (const required of [
  "persists i18n init failure evidence by entry",
  "keeps i18n init failure evidence when diagnostic console is blocked",
  "I18N_INIT_FAILURE_KEY",
]) {
  if (!helperTestText.includes(required)) violations.push(`${rel(helperTest)} must cover ${required}`);
}

if (violations.length) {
  console.error("[verify-i18n-init-failure-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-i18n-init-failure-boundary] OK - i18n init failures are persisted");
