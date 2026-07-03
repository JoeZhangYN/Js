import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvUtilsFile = path.normalize("src/i18n/hv-utils.js");
const evidenceFile = path.normalize("src/core/diagnostic-evidence-keys.js");
const text = fs.readFileSync(path.join(root, hvUtilsFile), "utf8");
const evidenceText = fs.readFileSync(path.join(root, evidenceFile), "utf8");
const violations = [];

function rel(file) {
  return file.replaceAll("\\", "/");
}

for (const required of [
  "var record_hvut_shrine_reward_parse_failure = function (stage, detail) {",
  "sessionStorage.setItem('HVAA:lastHvutShrineRewardParseFailure', JSON.stringify(evidence));",
  "var parse_hvut_shrine_reward_selection = function (button, stage) {",
  "return record_hvut_shrine_reward_parse_failure(stage, { onclick: onclick });",
  "const reward = parse_hvut_shrine_reward_selection(s, 'rewardSelectButton');",
  "const reward = parse_hvut_shrine_reward_selection(s, 'legacyRewardSelectButton');",
  "s.disabled = true;",
]) {
  if (!text.includes(required)) {
    violations.push(`${rel(hvUtilsFile)} missing Shrine reward boundary: ${required}`);
  }
}

if (/const exec = \/submit_shrine_reward/.test(text)) {
  violations.push(`${rel(hvUtilsFile)} must not parse Shrine reward onclick outside shared parser`);
}

for (const initBody of text.matchAll(/#accept_equip input\[type="submit"\][\s\S]*?\n\s*\}\);/g)) {
  const body = initBody[0];
  const rewardIndex = body.indexOf("parse_hvut_shrine_reward_selection");
  const actionIndex = body.indexOf("dataset.action = 'select'");
  if (rewardIndex < 0 || actionIndex < 0 || actionIndex < rewardIndex) {
    violations.push(`${rel(hvUtilsFile)} Shrine reward select action must be assigned only after parser success`);
  }
}

for (const required of [
  'HVUT_SHRINE_REWARD_PARSE_FAILURE: "HVAA:lastHvutShrineRewardParseFailure"',
  'source("hvutShrineRewardParseFailure", DiagnosticEvidenceKey.HVUT_SHRINE_REWARD_PARSE_FAILURE)',
]) {
  if (!evidenceText.includes(required)) {
    violations.push(`${rel(evidenceFile)} missing Shrine reward diagnostic source: ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-shrine-reward-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-shrine-reward-boundary] OK - Shrine reward selection parse fails closed");
