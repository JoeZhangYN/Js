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

const bodies = [
  ...text.matchAll(/_ab\.unlock = async function \(name, to\) \{[\s\S]*?\n  \};/g),
].map((match) => match[0]);

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

if (bodies.length !== 2) {
  violations.push(`${target} must keep both HVUT ability unlock segment entries visible`);
}

for (const [index, body] of bodies.entries()) {
  for (const required of [
    "let results;",
    "try {\n      results = await run_hvut_async_task_layout('SEQUENTIAL'",
    "catch (error) {",
    "const evidence = record_hvut_ability_unlock_failure(",
    "return run_hvut_ability_unlock_request(ab, { buttonStage:",
    "responseStage:",
    "show_hvut_failure_report('Ability unlock failed', evidence, ['HVAA:lastHvutAbilityParseFailure']);\n      return;",
    "if (results.length !== count || !results.every((r) => r)) return;",
    "reloadCurrentPage(hvutReloadReason('HV_UTILS_ABILITY_UNLOCK'))",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} ability unlock[${index}] must guard failure with ${required}`);
    }
  }
  if (/Promise\.all\s*\(/.test(body)) {
    violations.push(
      `${target} ability unlock[${index}] must serialize same-ability writes through task layout`
    );
  }
  if (/popup\(error\);\n\s*}\s*else/.test(body)) {
    violations.push(`${target} ability unlock[${index}] must not continue after HV error popup`);
  }
  if (/catch \(_error\) \{\n\s*alert\(IS_ISEKAI/.test(body)) {
    violations.push(`${target} ability unlock[${index}] must not keep untyped request failure`);
  }
  if (/record_hvut_ability_unlock_failure\([^;]+;\n\s*alert\(IS_ISEKAI/.test(body)) {
    violations.push(
      `${target} ability unlock[${index}] must show copyable diagnostic evidence instead of a bare alert`
    );
  }
  if (/\$ajax\.fetch\(location\.href/.test(body)) {
    violations.push(
      `${target} ability unlock[${index}] must delegate current-page POST to run_hvut_ability_unlock_request`
    );
  }
  if (/get_message\(doc\)/.test(body)) {
    violations.push(
      `${target} ability unlock[${index}] must not classify unlock response outside request entry`
    );
  }
  if (/ab\.div\.children\[2\]/.test(body)) {
    violations.push(
      `${target} ability unlock[${index}] must not rediscover button panel from raw DOM child index`
    );
  }
  if (/\$qs\('div\[style\*="u\.png"\]',\s*ab\.div/.test(body)) {
    violations.push(
      `${target} ability unlock[${index}] must use the typed ability unlock button parser`
    );
  }
}

const requestEntry =
  /var run_hvut_ability_unlock_request = async function \(ability, context\) \{[\s\S]*?\n  \};/.exec(
    text
  )?.[0] || "";
const requestAdapterDeclaration = text.indexOf("var $ajax;");
const hvutPageGuard = text.indexOf("if (!is_hvut_isekai_equip_page");
const requestAdapterAssignment = text.indexOf("$ajax = {");
if (
  requestAdapterDeclaration < 0 ||
  hvutPageGuard < 0 ||
  requestAdapterDeclaration > hvutPageGuard ||
  requestAdapterAssignment < hvutPageGuard ||
  /(?:const|let|var) \$ajax = \{/.test(text)
) {
  violations.push(
    `${target} must bind the shared HVUT request adapter in the enclosing runtime scope`
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
