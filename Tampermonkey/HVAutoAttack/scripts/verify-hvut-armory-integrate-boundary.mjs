import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const diagnosticTarget = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTestTarget = path.normalize("src/core/diagnostic-evidence.test.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const diagnosticText = fs.readFileSync(path.join(root, diagnosticTarget), "utf8");
const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTestTarget), "utf8");
const violations = [];

const initMatch = /init: async function \(screen\) \{[\s\S]*?\n      \},\n      load: async function/.exec(text);
const loadMatch = /load: async function \(screen, filter\) \{[\s\S]*?\n      \},\n      tab: function/.exec(text);

for (const required of [
  "var record_hvut_armory_integrate_failure = function (stage, detail) {",
  "capability: 'hvutArmoryIntegrate'",
  "sessionStorage.setItem('HVAA:lastHvutArmoryIntegrateFailure'",
  "console.warn('[HVUT] Armory integrate failed', evidence)",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must define Armory integrate evidence with ${required}`);
  }
}

if (!initMatch) {
  violations.push(`${target} must keep the Armory integrate init entry visible`);
} else {
  const body = initMatch[0];
  for (const required of [
    "const results = await Promise.all($armory.filters.map((filter) => $armory.integrate.load(screen, filter)));",
    "run_hvut_i18n_bridge('retranslateEquiplist', [], 'retranslateEquiplistBridgeMissing', { surface: 'armoryIntegrate' }, false);",
    "if (!results.every((r) => r)) {",
    "const failedFilters = $armory.filters.filter((_filter, index) => !results[index]);",
    "record_hvut_armory_integrate_failure('integrateIncomplete', { screen: screen, failedFilters: failedFilters });",
    "alert((IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.') + '\\nHVAA:lastHvutArmoryIntegrateFailure');",
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
  if (body.includes("window.HVAA_i18n.retranslateEquiplist()")) {
    violations.push(`${target} Armory integrate init must not call the i18n bridge directly`);
  }
}

if (!loadMatch) {
  violations.push(`${target} must keep the Armory integrate load entry visible`);
} else {
  const body = loadMatch[0];
  for (const required of [
    "let table;",
    "try {\n          table = await $armory.page.load(screen, filter, true);",
    "catch (error) {\n          record_hvut_armory_integrate_failure('loadRequest'",
    "if (!table) {\n          record_hvut_armory_integrate_failure('loadTableMissing'",
    "if (!table.tBodies[0]) {\n            record_hvut_armory_integrate_failure('loadTableBodyMissing'",
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

for (const required of [
  'HVUT_ARMORY_INTEGRATE_FAILURE: "HVAA:lastHvutArmoryIntegrateFailure"',
  'source("hvutArmoryIntegrateFailure", DiagnosticEvidenceKey.HVUT_ARMORY_INTEGRATE_FAILURE)',
]) {
  if (!diagnosticText.includes(required)) {
    violations.push(`${diagnosticTarget} must include ${required}`);
  }
}

for (const required of [
  "HVAA:lastHvutArmoryIntegrateFailure",
  "hvutArmoryIntegrateFailure",
  'capability: "hvutArmoryIntegrate"',
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${diagnosticTestTarget} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-armory-integrate-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-armory-integrate-boundary] OK - Armory integrate load failures fail closed");
