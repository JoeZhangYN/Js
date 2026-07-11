import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function count(part) {
  return text.split(part).length - 1;
}

function requireCount(label, part, expected) {
  const actual = count(part);
  if (actual !== expected) {
    violations.push(`${target} ${label} must appear ${expected} time(s), found ${actual}: ${part}`);
  }
}

for (const [label, part, expected] of [
  ["settings persistence guard", "if (!$config.set('se_settings', _se.json)) {", 4],
  ["settings remove failure restore", "_se.json[name] = removed;", 2],
  ["settings save previous capture", "const previous = _se.json[name];", 2],
  ["settings save new-entry rollback", "delete _se.json[name];", 4],
  ["settings delayed button creation", "if (!exists) {\n      _se.add(name);\n    }", 2],
]) {
  requireCount(label, part, expected);
}

for (const part of [
  "show_hvut_generic_error();",
  "return false;",
  "return true;",
]) {
  if (!text.includes(part)) {
    violations.push(`${target} must include ${part}`);
  }
}

for (const forbidden of [
  "$config.set('se_settings', _se.json);",
  "if (!_se.json[name]) {\n      _se.add(name);\n    }\n    const form = new FormData(_se.form);",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unchecked settings persistence path: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-settings-persistence-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-settings-persistence-boundary] OK - settings persistence failures fail closed"
);
