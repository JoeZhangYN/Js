import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

const initMatch = /init: async function \(screen\) \{[\s\S]*?\n      \},\n      load: async function/.exec(text);
const loadMatch = /load: async function \(screen, filter\) \{[\s\S]*?\n      \},\n      tab: function/.exec(text);

if (!initMatch) {
  violations.push(`${target} must keep the Armory integrate init entry visible`);
} else {
  const body = initMatch[0];
  for (const required of [
    "const results = await Promise.all($armory.filters.map((filter) => $armory.integrate.load(screen, filter)));",
    "if (window.HVAA_i18n && window.HVAA_i18n.retranslateEquiplist) {",
    "if (!results.every((r) => r)) {",
    "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
    "return false;",
    "return true;",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Armory integrate init must guard completion with ${required}`);
    }
  }
  if (/\n\s*await Promise\.all\(\$armory\.filters\.map[\s\S]*?\);\n\s*\/\/ filter=all/.test(body)) {
    violations.push(`${target} Armory integrate init must not ignore load results`);
  }
}

if (!loadMatch) {
  violations.push(`${target} must keep the Armory integrate load entry visible`);
} else {
  const body = loadMatch[0];
  for (const required of [
    "let table;",
    "try {\n          table = await $armory.page.load(screen, filter, true);",
    "catch (_error) {\n          holder.remove();\n          return false;",
    "$armory.filter.update();\n        return true;",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Armory integrate load must fail closed with ${required}`);
    }
  }
  if (/const table = await \$armory\.page\.load\(screen, filter, true\);/.test(body)) {
    violations.push(`${target} Armory integrate load must not leave raw async load failures`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-armory-integrate-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-armory-integrate-boundary] OK - Armory integrate load failures fail closed");
