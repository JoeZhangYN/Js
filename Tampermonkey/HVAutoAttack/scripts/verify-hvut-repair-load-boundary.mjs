import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const diagnosticTarget = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const diagnosticText = fs.readFileSync(path.join(root, diagnosticTarget), "utf8");
const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const loadRepair =
  /battle\.load_repair = async function \(equips\) \{[\s\S]*?\n  \};\n  battle\.update_link/.exec(text)?.[0] || "";
if (!loadRepair) violations.push(`${target} must keep battle.load_repair visible`);

for (const required of [
  "var record_hvut_repair_load_failure = function (stage, detail) {",
  "capability: 'hvutRepairLoad'",
  "sessionStorage.setItem('HVAA:lastHvutRepairLoadFailure'",
  "var classify_hvut_repair_load_response = function (doc, stage, detail) {",
  "record_hvut_repair_load_failure(stage, { ...detail, reason: 'rejectedResponse', message: message });",
  "return { kind: 'rejected', reason: 'rejectedResponse', message: message, evidence: evidence };",
  "return { kind: 'accepted' };",
  "var parse_hvut_repair_load_page = function (doc, html, stage, detail) {",
  "reason: 'equipformMissing'",
  "reason: 'scriptParseFailed'",
  "record_hvut_repair_load_failure('battlePanelRepairDynjsFetch'",
  "record_hvut_repair_load_failure('battlePanelRepairDynjsParse'",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must own HVUT repair load evidence with ${required}`);
  }
}

for (const required of [
  "const response = classify_hvut_repair_load_response(doc, 'battlePanelRepairLoadResponse'",
  "if (response.kind === 'rejected') {",
  "popup(response.message);",
  "battle.load_items();",
  "return false;",
  "const page = parse_hvut_repair_load_page(doc, html, 'battlePanelRepairLoadPage'",
  "if (page.kind === 'rejected') {",
  "battle.postoken = page.postoken;",
  "battle.eqitems = page.eqitems;",
  "battle.itemdata = page.itemdata;",
  "await battle.load_dynjs(doc);",
]) {
  requirePart("battle.load_repair", loadRepair, required);
}

for (const forbidden of [
  "const error = get_message(doc);",
  "popup(error);",
  "battle.postoken = $id('equipform', doc).elements.postoken.value;",
]) {
  if (loadRepair.includes(forbidden)) {
    violations.push(`${target} battle.load_repair must classify repair load response instead of ${forbidden}`);
  }
}

for (const required of [
  'HVUT_REPAIR_LOAD_FAILURE: "HVAA:lastHvutRepairLoadFailure"',
  'source("hvutRepairLoadFailure", DiagnosticEvidenceKey.HVUT_REPAIR_LOAD_FAILURE)',
]) {
  if (!diagnosticText.includes(required)) {
    violations.push(`${diagnosticTarget} must include ${required}`);
  }
}
if (!diagnosticTestText.includes("HVAA:lastHvutRepairLoadFailure")) {
  violations.push(`${diagnosticTest} must cover HVUT repair load evidence`);
}

if (violations.length) {
  console.error("[verify-hvut-repair-load-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-repair-load-boundary] OK - battle panel repair load responses fail closed with evidence");
