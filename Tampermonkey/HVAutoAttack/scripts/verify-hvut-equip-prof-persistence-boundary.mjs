import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const saveBody =
  /save: function \(key = _eq\.prof\.current\) \{[\s\S]*?\n    \},\n    name: function/.exec(text)?.[0] || "";
const deleteBody =
  /delete: function \(key = _eq\.prof\.current\) \{[\s\S]*?\n    \},\n    toggle: function/.exec(text)?.[0] || "";

if (!saveBody) violations.push(`${target} must keep equipment proficiency save entry visible`);
if (!deleteBody) violations.push(`${target} must keep equipment proficiency delete entry visible`);

for (const part of [
  "const json = JSON.parse(JSON.stringify(data.values));",
  "const persisted = _eq.prof.list.filter((entry) => entry === data || !entry.new).map((entry) => (entry === data ? json : entry.json));",
  "if (!$config.set('eq_prof', persisted)) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "data.json = json;",
  "data.node.button.classList.remove('hvut-eq-new');",
  "data.new = false;",
  "return true;",
]) {
  requirePart("equipment proficiency save", saveBody, part);
}

for (const part of [
  "const json = _eq.prof.list.filter((entry) => entry !== data && !entry.new).map((data) => data.json);",
  "if (!$config.set('eq_prof', json)) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "data.node.button.remove();",
  "_eq.prof.list.splice(index, 1);",
  "_eq.prof.load();",
  "return true;",
]) {
  requirePart("equipment proficiency delete", deleteBody, part);
}

for (const [label, body, forbidden] of [
  ["equipment proficiency save", saveBody, "$config.set('eq_prof', json);"],
  ["equipment proficiency delete", deleteBody, "$config.set('eq_prof', json);"],
  ["equipment proficiency save", saveBody, "data.node.button.classList.remove('hvut-eq-new');\n        data.new = false;\n      }\n      data.json = JSON.parse"],
  ["equipment proficiency delete", deleteBody, "data.node.button.remove();\n      const index"],
]) {
  if (body.includes(forbidden)) {
    violations.push(`${target} ${label} must not keep unchecked eq_prof path: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-equip-prof-persistence-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-equip-prof-persistence-boundary] OK - equipment proficiency persistence failures fail closed");
