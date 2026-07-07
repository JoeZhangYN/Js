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

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const submitBody =
  /submit: \{[\s\S]*?\n    \},\n\n    organize: \{/.exec(text)?.[0] || "";
const organizeSubmitBody =
  /submit: async function \(eid, name, value = true\) \{[\s\S]*?\n      \},\n      status: function/.exec(text)?.[0] || "";

if (!submitBody) violations.push(`${target} must keep Armory submit entry visible`);
if (!organizeSubmitBody) violations.push(`${target} must keep Armory organize submit entry visible`);

for (const required of [
  "var record_hvut_armory_submit_failure = function (stage, detail) {",
  "capability: 'hvutArmorySubmit'",
  "sessionStorage.setItem('HVAA:lastHvutArmorySubmitFailure'",
  "var classify_hvut_armory_submit_response = function (doc, stage, detail) {",
  "var evidence = record_hvut_armory_submit_failure(stage, { ...detail, reason: 'messageMissing' });",
  "return { kind: 'rejected', reason: 'messageMissing', evidence: evidence };",
  "return { kind: 'accepted', message: message };",
]) {
  if (!text.includes(required)) violations.push(`${target} must define Armory submit evidence with ${required}`);
}

for (const [label, stage, fetchCall] of [
  ["purchase", "purchaseRequest", "$ajax.fetch('?s=Bazaar&ss=am&screen=purchase', data);"],
  ["sell", "sellRequest", "$ajax.fetch('?s=Bazaar&ss=am&screen=sell', data);"],
  ["salvage", "salvageRequest", "$ajax.fetch('?s=Bazaar&ss=am&screen=salvage', data + '&sell_salvage=on');"],
]) {
  for (const required of [
    `${label}: async function (equips) {`,
    "if (!data) {\n          return false;\n        }",
    "let html;",
    "try {",
    fetchCall,
    `record_hvut_armory_submit_failure('${stage}'`,
    "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
    "return false;",
    `const response = classify_hvut_armory_submit_response(doc, '${label}Rejected', { count: equips.length });`,
    "if (response.kind !== 'accepted') {",
    "$armory.submit.message(response);",
    "$armory.submit.remove(equips);",
    "return true;",
  ]) {
    requirePart(`Armory ${label} submit`, submitBody, required);
  }
}

for (const required of [
  "purchase_salvage: async function (equips) {",
  "if (!await $armory.submit.purchase(equips)) {\n          return false;\n        }",
  "return $armory.submit.salvage(equips);",
]) {
  requirePart("Armory purchase_salvage submit", submitBody, required);
}

for (const required of [
  "submit: async function (eid, name, value = true) {",
  "let html;",
  "try {\n          html = await $ajax.fetch(create_hvut_armory_organize_url()",
  "record_hvut_armory_submit_failure('organizeRequest'",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "const response = classify_hvut_armory_submit_response(doc, 'organizeRejected', { count: equips.length, name: name, value: value });",
  "if (response.kind !== 'accepted') {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "$armory.submit.message(response);",
  "$armory.organize.status(eq, name, value);",
  "return true;",
]) {
  requirePart("Armory organize submit", organizeSubmitBody, required);
}

for (const forbidden of [
  "const html = await $ajax.fetch('?s=Bazaar&ss=am&screen=purchase', data);",
  "const html = await $ajax.fetch('?s=Bazaar&ss=am&screen=sell', data);",
  "const html = await $ajax.fetch('?s=Bazaar&ss=am&screen=salvage', data + '&sell_salvage=on');",
  "await $armory.submit.purchase(equips);\n        await $armory.submit.salvage(equips);",
  "$armory.submit.message(doc);",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} Armory submit must not keep unchecked path: ${forbidden}`);
  }
}

if (organizeSubmitBody.includes("const html = await $ajax.fetch('?s=Bazaar&ss=am&screen=organize', data + `&set_${param_name}=${param_value}`);")) {
  violations.push(`${target} Armory organize submit must not keep unchecked organize submit request`);
}

if (organizeSubmitBody.includes("$ajax.fetch('?s=Bazaar&ss=am&screen=organize'")) {
  violations.push(`${target} Armory organize submit must route through create_hvut_armory_organize_url`);
}

for (const required of [
  'HVUT_ARMORY_SUBMIT_FAILURE: "HVAA:lastHvutArmorySubmitFailure"',
  'source("hvutArmorySubmitFailure", DiagnosticEvidenceKey.HVUT_ARMORY_SUBMIT_FAILURE)',
]) {
  if (!diagnosticText.includes(required)) violations.push(`${diagnosticTarget} must include ${required}`);
}

if (!diagnosticTestText.includes("HVAA:lastHvutArmorySubmitFailure")) {
  violations.push(`${diagnosticTestTarget} must cover Armory submit diagnostic evidence`);
}

if (violations.length) {
  console.error("[verify-hvut-armory-submit-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-armory-submit-boundary] OK - Armory submit failures fail closed");
