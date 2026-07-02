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

for (const [label, part] of [
  ["Monster Lab placement save guard", "if (!$config.set('ml_plc', _ml.plc.list.filter((m) => m).map((m) => m.json))) {"],
  ["MoogleMail user list save guard", "if (!$config.set('mm_userlist', _mm.userlist.list)) {"],
  ["list persistence failure alert", "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');"],
  ["list persistence false return", "return false;"],
  ["list persistence true return", "return true;"],
  ["user list popup failure guard", "if (_mm.userlist.save() === false) return;"],
]) {
  if (!text.includes(part)) {
    violations.push(`${target} must include ${label}: ${part}`);
  }
}

requireCount("Monster Lab placement save guard", "if (!$config.set('ml_plc', _ml.plc.list.filter((m) => m).map((m) => m.json))) {", 2);
requireCount("MoogleMail user list save guard", "if (!$config.set('mm_userlist', _mm.userlist.list)) {", 2);
requireCount("user list popup failure guard", "if (_mm.userlist.save() === false) return;", 2);

for (const forbidden of [
  "$config.set('ml_plc', _ml.plc.list.filter((m) => m).map((m) => m.json));",
  "$config.set('mm_userlist', _mm.userlist.list);",
  "_mm.userlist.save();\n            p.close();",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unchecked list persistence path: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-list-persistence-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-list-persistence-boundary] OK - list persistence failures fail closed");
