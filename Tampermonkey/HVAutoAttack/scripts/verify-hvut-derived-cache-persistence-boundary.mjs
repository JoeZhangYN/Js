import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

function requireCount(label, part, expected) {
  const actual = text.split(part).length - 1;
  if (actual !== expected) {
    violations.push(`${target} ${label} must appear ${expected} time(s), found ${actual}: ${part}`);
  }
}

const abilityInit =
  /_ab\.init = function \(\) \{[\s\S]*?\n  \};\n\n  _ab\.parse_slotbar/.exec(text)?.[0] || "";
const trainingInit =
  /_tr\.init = function \(\) \{[\s\S]*?\n  \};\n\n  _tr\.parse_table/.exec(text)?.[0] || "";
const trainingParse =
  /_tr\.parse_table = function \(\) \{[\s\S]*?\n  \};\n\n  _tr\.parse_progress/.exec(text)?.[0] ||
  "";
const legacyAbility =
  /if \(!\$config\.set\('ab_level', _ab\.level\)\) \{[\s\S]*?\$input\(\['button', '能力点计算器'[\s\S]*?\n\} else\n\/\/ \[END 3\] Character - Abilities/.exec(
    text
  )?.[0] || "";
const legacyTraining =
  /\$element\('tr', \$id\('train_table'\)[\s\S]*?\n\} else\n\/\/ \[END 4\] Character - Training/.exec(
    text
  )?.[0] || "";

if (!abilityInit) violations.push(`${target} must keep ability init entry visible`);
if (!trainingInit) violations.push(`${target} must keep training init entry visible`);
if (!trainingParse) violations.push(`${target} must keep training parse_table entry visible`);
if (!legacyAbility) violations.push(`${target} must keep legacy ability cache region visible`);
if (!legacyTraining) violations.push(`${target} must keep legacy training cache region visible`);

for (const [label, body, part] of [
  ["ability init", abilityInit, "if (!$config.set('ab_level', _ab.level)) {"],
  ["legacy ability cache", legacyAbility, "if (!$config.set('ab_level', _ab.level)) {"],
  ["training parse_table", trainingParse, "if (!$config.set('tr_level', _tr.level)) {"],
  ["legacy training cache", legacyTraining, "if (!$config.set('tr_level', _tr.level)) {"],
]) {
  requirePart(label, body, part);
  requirePart(label, body, "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');");
  requirePart(label, body, "return false;");
}

for (const part of [
  "if (_tr.parse_table() === false) return false;",
  "if (_tr.parse_progress() === false) return false;",
  "return true;",
]) {
  requirePart("training init", trainingInit, part);
}

requireCount("ability derived cache guard", "if (!$config.set('ab_level', _ab.level)) {", 2);
requireCount("training derived cache guard", "if (!$config.set('tr_level', _tr.level)) {", 2);

for (const forbidden of [
  "$config.set('ab_level', _ab.level);",
  "$config.set('tr_level', _tr.level);",
  "_tr.parse_table();\n    _tr.parse_progress();",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unchecked derived cache path: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-derived-cache-persistence-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-derived-cache-persistence-boundary] OK - derived cache persistence failures fail closed"
);
