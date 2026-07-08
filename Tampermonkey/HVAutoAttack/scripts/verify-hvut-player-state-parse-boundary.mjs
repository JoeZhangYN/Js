import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const diagnosticTarget = path.normalize("src/core/diagnostic-evidence-keys.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const diagnosticText = fs.readFileSync(path.join(root, diagnosticTarget), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const helperRegion =
  /var record_hvut_player_state_parse_failure = function \(stage, detail\) \{[\s\S]*?\n  var reloadCurrentPage/.exec(
    text
  )?.[0] || "";

if (!helperRegion) violations.push(`${target} must keep player state parse helper visible`);

for (const required of [
  "sessionStorage.setItem('HVAA:lastHvutPlayerStateParseFailure', JSON.stringify(evidence));",
  "var parse_hvut_player_state = function (levelExec, staminaReadout, stage) {",
  "return record_hvut_player_state_parse_failure(stage, { reason: 'staminaReadoutMissing' });",
  "var staminaMatch = /Stamina: (\\d+)/.exec(staminaReadout.textContent || '');",
  "return record_hvut_player_state_parse_failure(stage, { reason: 'staminaValueMissing', text: staminaReadout.textContent || '' });",
  "var accuracyNode = staminaReadout.querySelector('div:nth-child(2)');",
  "var conditionNode = staminaReadout.querySelector('img[title^=\"Stamina\"]');",
]) {
  requirePart("player state parse helper", helperRegion, required);
}

for (const required of [
  "const _player = parse_hvut_player_state(level_exec, $id('stamina_readout'), 'mainPlayerState');",
  "const _player = parse_hvut_player_state(level_exec, $id('stamina_readout'), 'isekaiPlayerState');",
]) {
  if (!text.includes(required))
    violations.push(`${target} must route player state through ${required}`);
}

const nullGuardCount = (text.match(/if \(_player === null\) return;/g) || []).length;
if (nullGuardCount !== 2) {
  violations.push(
    `${target} must keep fail-closed player state guards for both segments, found ${nullGuardCount}`
  );
}

for (const forbidden of [
  "stamina: parseInt(/Stamina: (\\d+)/.exec($id('stamina_readout').textContent)[1])",
  "$qs('#stamina_readout > div:nth-child(2)').title",
  "$qs('#stamina_readout img[title^=\"Stamina\"]').title",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unchecked player state parse path: ${forbidden}`);
  }
}

for (const required of [
  'HVUT_PLAYER_STATE_PARSE_FAILURE: "HVAA:lastHvutPlayerStateParseFailure"',
  'source("hvutPlayerStateParseFailure", DiagnosticEvidenceKey.HVUT_PLAYER_STATE_PARSE_FAILURE)',
]) {
  if (!diagnosticText.includes(required)) {
    violations.push(`${diagnosticTarget} must include ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-player-state-parse-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-player-state-parse-boundary] OK - player state parse failures fail closed with evidence"
);
