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
  /save: function \(\) \{[\s\S]*?\n      \},\n      load: function/.exec(text)?.[0] || "";

if (!saveBody) violations.push(`${target} must keep Armory equipcode save entry visible`);

for (const part of [
  "let nextEquipdata = JSON.parse(JSON.stringify($armory.equipdata || { version: 1 }));",
  "nextEquipdata = { version: $armory.equipdata.version };",
  "nextEquipdata[eq.info.eid] = { checked: eq.node.check.checked, ...data };",
  "if (!$config.set('equipdata', nextEquipdata)) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "$armory.equipdata = nextEquipdata;",
  "return true;",
]) {
  requirePart("Armory equipcode save", saveBody, part);
}

for (const forbidden of [
  "$armory.equipdata = { version: $armory.equipdata.version };",
  "$armory.equipdata[eq.info.eid] = { checked: eq.node.check.checked, ...data };",
  "$config.set('equipdata', $armory.equipdata);",
]) {
  if (saveBody.includes(forbidden)) {
    violations.push(`${target} Armory equipcode save must not mutate or write unchecked equipdata: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-equipdata-persistence-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-equipdata-persistence-boundary] OK - Armory equipdata persistence failures fail closed");
