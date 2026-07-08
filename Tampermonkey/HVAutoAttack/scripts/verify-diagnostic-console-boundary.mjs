import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/core/diagnostic-console.js");
const ownerTest = path.normalize("src/core/diagnostic-console.test.js");
const migratedRuntimeFiles = [
  path.normalize("src/i18n/core/init-failure.js"),
  path.normalize("src/i18n/core/restore-failure.js"),
  path.normalize("src/pages/app-startup.js"),
  path.normalize("src/state/option-failure.js"),
  path.normalize("src/state/stamina-loss-log-failure.js"),
];
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
for (const required of [
  "DiagnosticConsoleEvent",
  "runDiagnosticConsoleAutomation",
  "diagnosticConsoleMethod",
  "EVENT_WARN",
  "EVENT_ERROR",
  "EVENT_INFO",
  "EVENT_DEBUG",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must own ${required}`);
  }
}

for (const forbidden of ["console.warn(", "console.error(", "console.log(", "console.info("]) {
  if (ownerText.includes(forbidden)) {
    violations.push(`${rel(owner)} must dispatch console methods through the typed method table`);
  }
}

for (const file of migratedRuntimeFiles) {
  const text = read(file);
  for (const required of ["DiagnosticConsoleEvent", "runDiagnosticConsoleAutomation"]) {
    if (!text.includes(required)) {
      violations.push(`${rel(file)} must route diagnostics through ${required}`);
    }
  }
  if (/\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(text)) {
    violations.push(`${rel(file)} must not use raw console after diagnostic console migration`);
  }
}

const ownerTestText = read(ownerTest);
for (const required of [
  "routes diagnostic warnings through the typed console entry",
  "isolates console hook failures from diagnostic evidence flows",
  "fails closed for unknown diagnostic console events",
]) {
  if (!ownerTestText.includes(required)) {
    violations.push(`${rel(ownerTest)} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-diagnostic-console-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-diagnostic-console-boundary] OK - migrated diagnostics use one console entry");
