import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const keysText = fs.readFileSync(path.join(root, "src/core/diagnostic-evidence-keys.js"), "utf8");
const diagnosticTestText = fs.readFileSync(path.join(root, "src/core/diagnostic-evidence.test.js"), "utf8");
const violations = [];

const bodies = [...text.matchAll(/_ab\.unlock = async function \(name, to\) \{[\s\S]*?\n  \};/g)].map(
  (match) => match[0]
);

for (const required of [
  "var record_hvut_ability_unlock_failure = function (stage, detail) {",
  "capability: 'hvutAbilityUnlock'",
  "sessionStorage.setItem('HVAA:lastHvutAbilityUnlockFailure'",
  "var parse_hvut_ability_unlock_button = function (ability, stage) {",
  "record_hvut_ability_unlock_failure(stage, { reason: 'abilityUnlockButtonMissing'",
  "var run_hvut_ability_unlock_request = async function (ability, context) {",
  "var html = await $ajax.fetch(location.href, `unlock_ability=${ability.id}`);",
  "var error = get_message(doc);",
  "if (error) {\n      popup(error);\n      return false;",
  "if (button) {",
  "return true;",
  "return false;",
  "parse_hvut_ability_unlock_button(ability, context?.buttonStage || 'abilityUnlockButton')",
]) {
  if (!text.includes(required)) violations.push(`${target} must include ability unlock diagnostic recorder: ${required}`);
}

for (const required of [
  'HVUT_ABILITY_UNLOCK_FAILURE: "HVAA:lastHvutAbilityUnlockFailure"',
  'source("hvutAbilityUnlockFailure", DiagnosticEvidenceKey.HVUT_ABILITY_UNLOCK_FAILURE)',
]) {
  if (!keysText.includes(required)) violations.push(`diagnostic evidence keys must include ${required}`);
}

if (!diagnosticTestText.includes("HVAA:lastHvutAbilityUnlockFailure")) {
  violations.push("diagnostic-evidence.test.js must cover HVUT ability unlock evidence");
}

if (bodies.length !== 2) {
  violations.push(`${target} must keep both HVUT ability unlock segment entries visible`);
}

for (const [index, body] of bodies.entries()) {
  for (const required of [
    "let results;",
    "try {\n      results = await Promise.all(requests);",
    "catch (error) {",
    "record_hvut_ability_unlock_failure(",
    "return run_hvut_ability_unlock_request(ab, { buttonStage:",
    "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');\n      return;",
    "if (!results.every((r) => r)) return;",
    "reloadCurrentPage(hvutReloadReason('HV_UTILS_ABILITY_UNLOCK'))",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} ability unlock[${index}] must guard failure with ${required}`);
    }
  }
  if (/await Promise\.all\(requests\);\n\s*reloadCurrentPage/.test(body)) {
    violations.push(`${target} ability unlock[${index}] must not reload after unchecked Promise.all`);
  }
  if (/popup\(error\);\n\s*}\s*else/.test(body)) {
    violations.push(`${target} ability unlock[${index}] must not continue after HV error popup`);
  }
  if (/catch \(_error\) \{\n\s*alert\(IS_ISEKAI/.test(body)) {
    violations.push(`${target} ability unlock[${index}] must not keep untyped request failure`);
  }
  if (/\$ajax\.fetch\(location\.href/.test(body)) {
    violations.push(`${target} ability unlock[${index}] must delegate current-page POST to run_hvut_ability_unlock_request`);
  }
  if (/get_message\(doc\)/.test(body)) {
    violations.push(`${target} ability unlock[${index}] must not classify unlock response outside request entry`);
  }
  if (/ab\.div\.children\[2\]/.test(body)) {
    violations.push(`${target} ability unlock[${index}] must not rediscover button panel from raw DOM child index`);
  }
  if (/\$qs\('div\[style\*="u\.png"\]',\s*ab\.div/.test(body)) {
    violations.push(`${target} ability unlock[${index}] must use the typed ability unlock button parser`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-ability-unlock-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-ability-unlock-boundary] OK - HVUT ability unlock failures fail closed");
