import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "src/i18n/hv-utils.js");
const text = fs.readFileSync(target, "utf8");
const violations = [];

const equipBody =
  text.match(/equip: function \(filters, equip\) \{[\s\S]*?\n    \},\n    match:/)?.[0] || "";
const failureBody =
  text.match(/recordFailure: function \(stage, detail\) \{[\s\S]*?\n    \},\n    equip:/)?.[0] || "";
const matchBody =
  text.match(/match: function \(filters, equip\) \{[\s\S]*?\n    \},\n    normalize:/)?.[0] || "";
const normalizeBody =
  text.match(/normalize: function \(filters\) \{[\s\S]*?\n    \},\n    test:/)?.[0] || "";
const validateBody =
  text.match(/validate: function \(filters\) \{[\s\S]*?\n    \},/)?.[0] || "";

if (!equipBody) {
  violations.push("equipment filter match entry must stay explicit");
}
if (!failureBody) {
  violations.push("equipment filter failure recorder must stay explicit");
}
if (!matchBody) {
  violations.push("equipment filter structured match result must stay explicit");
}
if (!validateBody) {
  violations.push("equipment filter validation entry must stay explicit");
}
if (!normalizeBody) {
  violations.push("equipment filter list normalization entry must stay explicit");
}

for (const required of [
  "try {",
  "const result = $equip.filter.match(filters, equip)",
  "$equip.filter.recordFailure('match', { equip: result.name, errors: result.errors })",
  "errors: result.errors",
  "return result.matched",
  "catch (error)",
  "$equip.filter.recordFailure('runtime', { equip, error: error?.message || String(error) })",
  "return false",
]) {
  if (!equipBody.includes(required)) {
    violations.push(`equipment filter match entry must include ${required}`);
  }
}

for (const required of [
  "capability: 'equipmentFilter'",
  "sessionStorage.setItem('HVAA:lastEquipmentFilterFailure'",
  "console.warn('[HVUT] equipment filter failed', evidence)",
  "Equipment filtering must fail closed even when diagnostic storage is blocked.",
  "Console hooks must not block equipment filtering fallback.",
]) {
  if (!failureBody.includes(required)) {
    violations.push(`equipment filter failure recorder must include ${required}`);
  }
}

for (const required of [
  "filters = $equip.filter.normalize(filters)",
  "name = equip?.info?.name ?? ''",
  "const errors = []",
  "filters.some((filter) =>",
  "try {",
  "return $equip.filter.test(filter, equip, name)",
  "errors.push({ filter, error: error?.message || String(error) })",
  "return false",
  "return { matched, errors, name }",
]) {
  if (!matchBody.includes(required)) {
    violations.push(`equipment filter structured match result must include ${required}`);
  }
}

for (const required of [
  "const rawFilters = Array.isArray(filters) ? filters : [filters]",
  ".flatMap((filter) => String(filter ?? '').split(/\\r?\\n/))",
  ".map((filter) => filter.trim())",
  ".filter(Boolean)",
]) {
  if (!normalizeBody.includes(required)) {
    violations.push(`equipment filter normalization must include ${required}`);
  }
}

for (const required of [
  "filters = $equip.filter.normalize(filters)",
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
  if (equipBody.includes(forbidden) || matchBody.includes(forbidden)) {
    violations.push(`equipment filter match entry must not throw from first invalid filter: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-equip-filter-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-equip-filter-boundary] OK - equipment filter runtime fails closed");
