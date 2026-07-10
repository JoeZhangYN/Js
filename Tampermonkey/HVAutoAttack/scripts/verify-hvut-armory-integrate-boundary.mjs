import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvutTarget = path.normalize("src/i18n/hv-utils.js");
const ownerTarget = path.normalize("src/i18n/hvut-armory-integration.js");
const readerTarget = path.normalize("src/i18n/hvut-armory-page-reader.js");
const bridgeTarget = path.normalize("src/i18n/hvut-armory-integration-bridge.js");
const mainTarget = path.normalize("src/main.js");
const diagnosticTarget = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTestTarget = path.normalize("src/core/diagnostic-evidence.test.js");
const read = (target) => fs.readFileSync(path.join(root, target), "utf8");
const hvut = read(hvutTarget);
const owner = read(ownerTarget);
const reader = read(readerTarget);
const bridge = read(bridgeTarget);
const main = read(mainTarget);
const diagnostic = read(diagnosticTarget);
const diagnosticTest = read(diagnosticTestTarget);
const violations = [];

function requireAll(target, text, needles) {
  for (const needle of needles) {
    if (!text.includes(needle)) violations.push(`${target} must include ${needle}`);
  }
}

requireAll(ownerTarget, owner, [
  "export function createArmoryIntegrationCapability(options)",
  "for (let index = 0; index < categories.length; index += 1)",
  'const outcome = failures.length ? (stages.length || empty.length ? "partial" : "failed") : "complete";',
  'if (outcome === "failed") deps.preserve(result);',
  "await deps.commit(result);",
  'deps.recordFailure("integrateIncomplete"',
]);
if (/Promise\.all\s*\(/.test(owner)) {
  violations.push(
    `${ownerTarget} must serialize Armory category reads instead of using Promise.all`
  );
}

requireAll(readerTarget, reader, [
  'credentials: "same-origin"',
  "finalUrl: response?.url || requestedUrl",
  'UNEXPECTED_PAGE: "unexpectedPage"',
  'LIMITED: "limited"',
  'filterbar?.querySelectorAll?.("a[href]")',
]);
requireAll(bridgeTarget, bridge, [
  "createArmoryIntegrationCapability",
  "createArmoryPageReader",
  "readArmoryCategories",
  "target.HVAA_armoryIntegration = bridge",
]);
requireAll(mainTarget, main, ['import "./i18n/hvut-armory-integration-bridge.js"']);
requireAll(hvutTarget, hvut, [
  "window.HVAA_armoryIntegration",
  "stageCategory: $armory.integrate.stage",
  "commit: $armory.integrate.commit",
  "preserve: $armory.integrate.preserve",
  "Array.from(table.tBodies).forEach((body) => body.remove());",
  "重试失败分类",
  "show_hvut_runtime_failure_report(render_hvut_armory_integrate_failure_log(evidence));",
]);
if (hvut.includes("Promise.all($armory.filters.map((filter) => $armory.integrate.load")) {
  violations.push(`${hvutTarget} must not retain the destructive parallel Armory loader`);
}

requireAll(diagnosticTarget, diagnostic, [
  'HVUT_ARMORY_INTEGRATE_FAILURE: "HVAA:lastHvutArmoryIntegrateFailure"',
  'source("hvutArmoryIntegrateFailure", DiagnosticEvidenceKey.HVUT_ARMORY_INTEGRATE_FAILURE)',
]);
requireAll(diagnosticTestTarget, diagnosticTest, [
  "HVAA:lastHvutArmoryIntegrateFailure",
  "hvutArmoryIntegrateFailure",
  'capability: "hvutArmoryIntegrate"',
]);

if (violations.length) {
  console.error("[verify-hvut-armory-integrate-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-armory-integrate-boundary] OK - Armory integration is factory-bound, serialized, atomic, and diagnosable"
);
