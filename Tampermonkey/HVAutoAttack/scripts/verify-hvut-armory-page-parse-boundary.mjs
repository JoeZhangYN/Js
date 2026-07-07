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
const armoryScriptParse =
  /script: \{\n      parse: function \(doc, screen, assign\) \{[\s\S]*?\n      \},\n      assign: function/.exec(text)?.[0] || "";

if (!armoryScriptParse) {
  violations.push(`${target} must keep Armory script.parse visible`);
}

for (const required of [
  "var record_hvut_armory_page_failure = function (stage, detail) {",
  "capability: 'hvutArmoryPage'",
  "sessionStorage.setItem('HVAA:lastHvutArmoryPageFailure'",
  "console.warn('[HVUT] Armory page failed', evidence)",
  "record_hvut_armory_page_failure('equipformMissing'",
  "return $armory.script.parse(doc, screen, assign);",
  "const readScriptObject = function (html, name, required) {",
  "record_hvut_armory_page_failure('scriptObjectParseFailed'",
  "record_hvut_armory_page_failure('scriptObjectMissing'",
  "record_hvut_armory_page_failure('scriptMissing'",
  "const requirements = {",
  "dynjs_eqstore: screen === 'purchase'",
  "eqitems: true",
  "itemdata: ['purchase', 'salvage'].includes(screen)",
  "dynjs_eqstore: readScriptObject(html, 'dynjs_eqstore', requirements.dynjs_eqstore)",
  "eqitems: readScriptObject(html, 'eqitems', requirements.eqitems)",
  "itemdata: readScriptObject(html, 'itemdata', requirements.itemdata)",
  "return accepted;",
  "href: create_hvut_armory_screen_url(screen, { filter: filter || '' })",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep Armory page parse boundary: ${required}`);
  }
}

for (const forbidden of [
  "$id('equipform', doc).elements.postoken?.value",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep raw Armory page parse path: ${forbidden}`);
  }
}

for (const forbidden of [
  "dynjs_eqstore: parse_script_json(html, 'dynjs_eqstore')",
  "eqitems: parse_script_json(html, 'eqitems')",
  "itemdata: parse_script_json(html, 'itemdata')",
  "itemdata: readScriptObject(html, 'itemdata', true)",
]) {
  if (armoryScriptParse.includes(forbidden)) {
    violations.push(`${target} Armory script.parse must not keep raw parse path: ${forbidden}`);
  }
}

for (const required of [
  'HVUT_ARMORY_PAGE_FAILURE: "HVAA:lastHvutArmoryPageFailure"',
  'source("hvutArmoryPageFailure", DiagnosticEvidenceKey.HVUT_ARMORY_PAGE_FAILURE)',
]) {
  if (!diagnosticText.includes(required)) {
    violations.push(`${diagnosticTarget} must expose ${required}`);
  }
}

for (const required of [
  "HVAA:lastHvutArmoryPageFailure",
  "hvutArmoryPageFailure",
  'capability: "hvutArmoryPage"',
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${diagnosticTestTarget} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-armory-page-parse-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-armory-page-parse-boundary] OK - Armory page parse failures are diagnosable");
