import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const offerLoad =
  /load: async function \(iid, reward_type, reward_slot\) \{[\s\S]*?\n    \},\n    toggle: function/.exec(text)?.[0] || "";
const logSave =
  /save: function \(\) \{[\s\S]*?\n    \},\n    reset: function/.exec(text)?.[0] || "";
const legacyRequest =
  /_ss\.request = async function \(iid, select_reward_type, select_reward_slot\) \{[\s\S]*?\n  \};\n\n  _ss\.toggle_results/.exec(text)?.[0] || "";

if (!offerLoad) violations.push(`${target} must keep Shrine offer load entry visible`);
if (!logSave) violations.push(`${target} must keep Shrine log save entry visible`);
if (!legacyRequest) violations.push(`${target} must keep legacy Shrine request entry visible`);

for (const part of [
  "if (_ss.log.save() === false) return false;",
  "return true;",
]) {
  requirePart("Shrine offer load", offerLoad, part);
}

for (const part of [
  "if (!$config.set('ss_log', _ss.log.json)) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "return true;",
]) {
  requirePart("Shrine log save", logSave, part);
}

for (const part of [
  "if (!$config.set('ss_log', _ss.log)) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "return true;",
]) {
  requirePart("legacy Shrine request", legacyRequest, part);
}

for (const [label, body, forbidden] of [
  ["Shrine offer load", offerLoad, "_ss.log.save();"],
  ["Shrine log save", logSave, "$config.set('ss_log', _ss.log.json);"],
  ["legacy Shrine request", legacyRequest, "$config.set('ss_log', _ss.log);"],
]) {
  if (body.includes(forbidden)) {
    violations.push(`${target} ${label} must not ignore Shrine log persistence: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-shrine-log-persistence-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-shrine-log-persistence-boundary] OK - Shrine log persistence failures fail closed");
