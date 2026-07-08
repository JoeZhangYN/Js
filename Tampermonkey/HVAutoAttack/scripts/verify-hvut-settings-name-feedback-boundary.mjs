import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function count(pattern) {
  return [...text.matchAll(pattern)].length;
}

for (const required of [
  "PROMPT_SETTINGS_NAME: 'promptSettingsName'",
  "settingsNamePrompt: { main: '输入方案名称', isekai: 'Enter the name of the settings' }",
  "prompt_hvut_settings_name",
  "type: HVUT_FEEDBACK_EVENT.PROMPT_SETTINGS_NAME",
  "copy: 'settingsNamePrompt'",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must own ${required}`);
  }
}

if (count(/\bprompt_hvut_settings_name\(/g) !== 3) {
  violations.push(
    `${target} must route three settings-name prompt call sites through prompt_hvut_settings_name`
  );
}

if (!text.includes("prompt_hvut_settings_name(data.values.name)")) {
  violations.push(`${target} must pass the current equipment proficiency name as prompt default`);
}

for (const forbidden of [
  "prompt('Enter the name of the settings'",
  'prompt("Enter the name of the settings"',
  "prompt('输入方案名称'",
  'prompt("输入方案名称"',
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not prompt settings names directly: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-settings-name-feedback-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-settings-name-feedback-boundary] OK - settings-name feedback uses one typed entry"
);
