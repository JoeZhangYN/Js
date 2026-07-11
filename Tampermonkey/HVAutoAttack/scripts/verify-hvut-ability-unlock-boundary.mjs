import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const keysText = fs.readFileSync(path.join(root, "src/core/diagnostic-evidence-keys.js"), "utf8");
const diagnosticTestText = fs.readFileSync(
  path.join(root, "src/core/diagnostic-evidence.test.js"),
  "utf8"
);
const violations = [];

const unlockEntry =
  /var unlock_hvut_ability_ranks = async function \(page, name, to\) \{[\s\S]*?\n  \};\n  var create_hvut_ability_calculator/.exec(
    text
  )?.[0] || "";

for (const required of [
  "var record_hvut_ability_unlock_failure = function (stage, detail) {",
  "capability: 'hvutAbilityUnlock'",
  "sessionStorage.setItem('HVAA:lastHvutAbilityUnlockFailure'",
  "var parse_hvut_ability_unlock_button = function (ability, stage) {",
  "record_hvut_ability_unlock_failure(stage, { reason: 'abilityUnlockButtonMissing'",
  "var classify_hvut_ability_unlock_response = function (doc, stage, detail) {",
  "record_hvut_ability_unlock_failure(stage, { ...detail, reason: 'rejectedResponse', error: error });",
  "return { kind: 'rejected', reason: 'rejectedResponse', message: error, evidence: evidence };",
  "return { kind: 'accepted' };",
  "var create_hvut_ability_unlock_url = function () {",
  "return location.href;",
  "var run_hvut_ability_unlock_request = async function (ability, context) {",
  "var html = await $ajax.fetch(create_hvut_ability_unlock_url(), `unlock_ability=${ability.id}`);",
  "var response = classify_hvut_ability_unlock_response(doc, context?.responseStage || 'abilityUnlockResponse'",
  "show_hvut_failure_report('Ability unlock failed', evidence, ['HVAA:lastHvutAbilityParseFailure']);",
  "if (response.kind === 'rejected') {\n      show_hvut_failure_report('Ability unlock failed', response.evidence, ['HVAA:lastHvutAbilityParseFailure']);\n      return false;",
  "if (button) {",
  "return true;",
  "return false;",
  "parse_hvut_ability_unlock_button(ability, context?.buttonStage || 'abilityUnlockButton')",
]) {
  if (!text.includes(required))
    violations.push(`${target} must include ability unlock diagnostic recorder: ${required}`);
}

for (const required of [
  'HVUT_ABILITY_UNLOCK_FAILURE: "HVAA:lastHvutAbilityUnlockFailure"',
  'source("hvutAbilityUnlockFailure", DiagnosticEvidenceKey.HVUT_ABILITY_UNLOCK_FAILURE)',
]) {
  if (!keysText.includes(required))
    violations.push(`diagnostic evidence keys must include ${required}`);
}

if (!diagnosticTestText.includes("HVAA:lastHvutAbilityUnlockFailure")) {
  violations.push("diagnostic-evidence.test.js must cover HVUT ability unlock evidence");
}

for (const required of [
  "var count = to - ability.level;",
  "var results = await run_hvut_async_task_layout('SEQUENTIAL'",
  "run_hvut_ability_unlock_request(ability, { buttonStage: 'abilityUnlockButton', responseStage: 'abilityUnlockResponse' })",
  "if (results.length !== count || !results.every((result) => result)) return false;",
  "catch (error) {",
  "var evidence = record_hvut_ability_unlock_failure('abilityUnlockRequest'",
  "show_hvut_failure_report('Ability unlock failed', evidence, ['HVAA:lastHvutAbilityParseFailure']);",
  "reloadCurrentPage(hvutReloadReason('HV_UTILS_ABILITY_UNLOCK'))",
]) {
  if (!unlockEntry.includes(required)) {
    violations.push(`${target} shared ability unlock entry must guard failure with ${required}`);
  }
}
for (const forbidden of [
  /Promise\.all\s*\(/,
  /_ab\.unlock\s*=/,
  /legacyAbilityUnlock/,
  /\$ajax\.fetch\(location\.href/,
  /get_message\(doc\)/,
  /ab\.div\.children\[2\]/,
]) {
  if (forbidden.test(unlockEntry || text)) {
    violations.push(`${target} shared ability unlock entry must retire ${forbidden}`);
  }
}

const requestEntry =
  /var run_hvut_ability_unlock_request = async function \(ability, context\) \{[\s\S]*?\n  \};/.exec(
    text
  )?.[0] || "";
const requestAdapterDeclaration = text.indexOf("const $ajax = {");
const hvutPageGuard = text.indexOf("if (HVUT_ENTRY_MODE === 'active') {");
if (
  requestAdapterDeclaration < 0 ||
  hvutPageGuard < 0 ||
  requestAdapterDeclaration > hvutPageGuard
) {
  violations.push(
    `${target} must compose the shared HVUT request adapter before applying entry policy`
  );
}
if (/var error = get_message\(doc\);/.test(requestEntry)) {
  violations.push(
    `${target} ability unlock request must use typed response classification instead of local error variable`
  );
}
if (/popup\(error\);/.test(requestEntry)) {
  violations.push(`${target} ability unlock request must popup the typed response message`);
}
if (/popup\(response\.message\);/.test(requestEntry)) {
  violations.push(
    `${target} ability unlock request must show copyable diagnostic evidence instead of a popup`
  );
}
if (/\$ajax\.fetch\(location\.href,\s*`unlock_ability=\$\{ability\.id\}`\)/.test(requestEntry)) {
  violations.push(
    `${target} ability unlock request must use create_hvut_ability_unlock_url instead of raw location.href`
  );
}

if (violations.length) {
  console.error("[verify-hvut-ability-unlock-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-ability-unlock-boundary] OK - HVUT ability unlock failures fail closed");
