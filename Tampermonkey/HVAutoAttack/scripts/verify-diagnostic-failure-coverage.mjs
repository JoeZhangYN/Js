import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const diagnosticKeysFile = path.join(root, "src/core/diagnostic-evidence-keys.js");
const diagnosticTestFile = path.join(root, "src/core/diagnostic-evidence.test.js");
const violations = [];

function collectJsFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectJsFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function isRuntimeFailureSource(file) {
  const relative = rel(file);
  return (
    !relative.endsWith(".test.js") &&
    relative !== "src/core/diagnostic-evidence-keys.js" &&
    relative !== "src/core/diagnostic-evidence.test.js"
  );
}

const runtimeFailureKeys = new Set();
for (const file of collectJsFiles(srcDir).filter(isRuntimeFailureSource)) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/HVAA:last[A-Za-z0-9]+Failure/g)) {
    runtimeFailureKeys.add(match[0]);
  }
}

const diagnosticKeysText = fs.readFileSync(diagnosticKeysFile, "utf8");
const diagnosticTestText = fs.readFileSync(diagnosticTestFile, "utf8");
const enumByKey = new Map();
for (const match of diagnosticKeysText.matchAll(/([A-Z0-9_]+):\s*"([^"]+)"/g)) {
  enumByKey.set(match[2], match[1]);
}

for (const key of [...runtimeFailureKeys].sort()) {
  const enumName = enumByKey.get(key);
  if (!enumName) {
    violations.push(`${key} must be represented by DiagnosticEvidenceKey`);
    continue;
  }
  const sourcePattern = new RegExp(
    `source\\("[^"]+",\\s*DiagnosticEvidenceKey\\.${enumName}\\)`
  );
  if (!sourcePattern.test(diagnosticKeysText)) {
    violations.push(`${key} must be listed in DIAGNOSTIC_EVIDENCE_SOURCES`);
  }
  if (!diagnosticTestText.includes(key)) {
    violations.push(`${key} must be covered by src/core/diagnostic-evidence.test.js`);
  }
}

if (violations.length) {
  console.error("[verify-diagnostic-failure-coverage] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-diagnostic-failure-coverage] OK - runtime failure evidence is diagnosable");
