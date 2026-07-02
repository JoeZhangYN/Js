import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const keysFile = path.join(root, "src/core/diagnostic-evidence-keys.js");
const testFile = path.join(root, "src/core/diagnostic-evidence.test.js");
const keysText = fs.readFileSync(keysFile, "utf8");
const testText = fs.readFileSync(testFile, "utf8");
const violations = [];

const enumEntries = [...keysText.matchAll(/([A-Z0-9_]+):\s*"([^"]+)"/g)].map(
  ([, name, key]) => ({ name, key })
);

const sourceEntries = [
  ...keysText.matchAll(/source\(\s*"([^"]+)",\s*DiagnosticEvidenceKey\.([A-Z0-9_]+)\s*\)/gs),
].map(([, sourceName, enumName]) => ({ sourceName, enumName }));

const sourceEnumNames = new Set(sourceEntries.map((entry) => entry.enumName));
const duplicateSources = sourceEntries
  .map((entry) => entry.sourceName)
  .filter((name, index, list) => list.indexOf(name) !== index);

for (const { name, key } of enumEntries) {
  if (!sourceEnumNames.has(name)) {
    violations.push(`${name} (${key}) must be listed in DIAGNOSTIC_EVIDENCE_SOURCES`);
    continue;
  }
  if (!testText.includes(key)) {
    violations.push(`${name} (${key}) must be covered by diagnostic-evidence.test.js`);
  }
}

if (duplicateSources.length) {
  violations.push(`duplicate diagnostic source names: ${[...new Set(duplicateSources)].join(", ")}`);
}

if (!keysText.includes("item.key !== DiagnosticEvidenceKey.BATTLE_API_RESPONSE_RECOVERY")) {
  violations.push("API response script diagnostics must exclude self-nesting recovery state");
}

if (violations.length) {
  console.error("[verify-diagnostic-evidence-source-coverage] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-diagnostic-evidence-source-coverage] OK - diagnostic keys are readable");
