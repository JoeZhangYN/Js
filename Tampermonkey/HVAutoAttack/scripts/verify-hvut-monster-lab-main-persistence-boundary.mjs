import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function requirePart(label, value, part) {
  if (!value.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const parseBody =
  /parse: function \(\) \{[\s\S]*?\n      \},\n      sort: function/.exec(text)?.[0] || "";
const initTail =
  /_ml\.main\.init\(\);[\s\S]*?_ml\.main\.make_summary\(\);/.exec(text)?.[0] || "";
const inlineInit =
  /\/\/ Initializing List[\s\S]*?\n    \/\/ Monster Upgrader/.exec(text)?.[0] || "";

if (!parseBody) violations.push(`${target} must keep Monster Lab main parse entry visible`);
if (!initTail) violations.push(`${target} must keep Monster Lab main parse caller visible`);
if (!inlineInit) violations.push(`${target} must keep Monster Lab inline main initialization visible`);

for (const part of [
  "let parseFailed = false;",
  "const surface = parse_hvut_monster_lab_main_surface(div, 'mainMonsterSurface');",
  "if (surface === null) {",
  "parseFailed = true;",
  "if (parseFailed) return false;",
  "if (!$config.set('ml_log', _ml.log)) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "return true;",
]) {
  requirePart("main parse", parseBody, part);
}

for (const part of [
  "if (_ml.main.parse() === false) {",
  "return false;",
  "_ml.main.make_summary();",
]) {
  requirePart("main parse caller", initTail, part);
}

for (const part of [
  "let parseFailed = false;",
  "const surface = parse_hvut_monster_lab_main_surface(div, 'legacyMainMonsterSurface');",
  "if (surface === null) {",
  "parseFailed = true;",
  "if (parseFailed) {",
  "if (!$config.set('ml_log', _ml.log)) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "$id('monster_list').addEventListener('click', _ml.main.click, true);",
  "_ml.main.make_summary();",
]) {
  requirePart("inline main initialization", inlineInit, part);
}

for (const [label, value] of [
  ["main parse", parseBody],
  ["inline main initialization", inlineInit],
]) {
  if (/\$config\.set\('ml_log', _ml\.log\);\n\s*(?:\}|(?:\$id\('monster_list'\)))/.test(value)) {
    violations.push(`${target} ${label} must not continue after unchecked ml_log write`);
  }
  if (/mob\.name = div\.children\[1\]\.textContent|hungerdiv\.firstElementChild\.firstElementChild/.test(value)) {
    violations.push(`${target} ${label} must not read Monster Lab roster DOM outside shared parser`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-monster-lab-main-persistence-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-monster-lab-main-persistence-boundary] OK - Monster Lab main persistence failures fail closed");
