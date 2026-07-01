import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "src/i18n/hv-utils.js");
const text = fs.readFileSync(target, "utf8");
const violations = [];

const equipBody =
  text.match(/equip: function \(filters, equip\) \{[\s\S]*?\n    \},\n    test:/)?.[0] || "";
const validateBody =
  text.match(/validate: function \(filters\) \{[\s\S]*?\n    \},/)?.[0] || "";

if (!equipBody) {
  violations.push("equipment filter match entry must stay explicit");
}
if (!validateBody) {
  violations.push("equipment filter validation entry must stay explicit");
}

for (const required of [
  "filters = Array.isArray(filters) ? filters : [filters]",
  "const errors = []",
  "filters.some((filter) =>",
  "try {",
  "return $equip.filter.test(filter, equip, name)",
  "errors.push({ filter, error: error?.message || String(error) })",
  "return false",
  "console.warn('[HVUT] equipment filter failed'",
  "return matched",
]) {
  if (!equipBody.includes(required)) {
    violations.push(`equipment filter match entry must include ${required}`);
  }
}

for (const required of [
  "$equip.filter.test(filter, null, '')",
  "return true",
  "const error = errors.join('\\n')",
]) {
  if (!validateBody.includes(required)) {
    violations.push(`equipment filter validation entry must keep strict error reporting: ${required}`);
  }
}

for (const forbidden of [
  "return filters.some((f) => $equip.filter.test(f, equip, name))",
  "return filters.some((filter) => $equip.filter.test(filter, equip, name))",
]) {
  if (equipBody.includes(forbidden)) {
    violations.push(`equipment filter match entry must not throw from first invalid filter: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-equip-filter-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-equip-filter-boundary] OK - equipment filter runtime fails closed");
