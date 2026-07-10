import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvutTarget = path.normalize("src/i18n/hv-utils.js");
const ownerTarget = path.normalize("src/i18n/hvut-armory-integration.js");
const readerTarget = path.normalize("src/i18n/hvut-armory-page-reader.js");
const factsTarget = path.normalize("src/i18n/hvut-armory-page-facts.js");
const loadingTarget = path.normalize("src/i18n/hvut-armory-loading-view.js");
const loadingTestTarget = path.normalize("src/i18n/hvut-armory-loading-view.test.js");
const lifecycleTestTarget = path.normalize("src/i18n/hvut-armory-integration-lifecycle.test.js");
const bridgeTarget = path.normalize("src/i18n/hvut-armory-integration-bridge.js");
const mainTarget = path.normalize("src/main.js");
const diagnosticTarget = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTestTarget = path.normalize("src/core/diagnostic-evidence.test.js");
const read = (target) => fs.readFileSync(path.join(root, target), "utf8");
const hvut = read(hvutTarget);
const owner = read(ownerTarget);
const reader = read(readerTarget);
const facts = read(factsTarget);
const loading = read(loadingTarget);
const loadingTest = read(loadingTestTarget);
const lifecycleTest = read(lifecycleTestTarget);
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
  "await deps.beginLoading({ screen: event.screen, categories, retrying });",
  "deps.reportCategory({",
  "status = ArmoryCategoryStatus.STAGED;",
  "status = ArmoryCategoryStatus.EMPTY;",
  'reason: "categoryExecutionFailed"',
  "await deps.restoreLoading(result);",
  "await deps.commit(result);",
  "deps.completeLoading(result);",
  'await deps.restoreLoading({ outcome: "aborted", retrying });',
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
requireAll(factsTarget, facts, [
  "export function readArmoryPageFacts(doc, screen)",
  "ArmoryPageFactsKind.FACTS",
  "ArmoryPageFactsKind.REJECTED",
]);
requireAll(loadingTarget, loading, [
  "export function createArmoryLoadingView({ document, table, categoryOrder })",
  "originalBodies",
  "placeholders",
  "function progress({ category, status })",
  "function restore()",
  "function complete()",
  'LOADING]: "Loading..."',
]);
requireAll(loadingTestTarget, loadingTest, [
  "replaces the original row with ordered placeholders and reports serial progress",
  "restores the exact original table after an aborted integration",
  "only replaces and restores attempted failure rows during retry",
]);
requireAll(lifecycleTestTarget, lifecycleTest, [
  "keeps the async loop alive when one category stage throws",
  "restores the original table when final commit throws",
  "ArmoryCategoryStatus.FAILED",
  "ArmoryCategoryStatus.STAGED",
]);
requireAll(bridgeTarget, bridge, [
  "createArmoryIntegrationCapability",
  "createArmoryPageReader",
  "readArmoryCategories",
  "createArmoryLoadingView",
  "beginLoading: loadingView.begin",
  "reportCategory: loadingView.progress",
  "restoreLoading: loadingView.restore",
  "completeLoading: loadingView.complete",
  "target.HVAA_armoryIntegration = bridge",
]);
requireAll(mainTarget, main, ['import "./i18n/hvut-armory-integration-bridge.js"']);
requireAll(hvutTarget, hvut, [
  "window.HVAA_armoryIntegration",
  "stageCategory: $armory.integrate.stage",
  "table: $armory.node.table",
  "commit: $armory.integrate.commit",
  "preserve: $armory.integrate.preserve",
  "Array.from(table.tBodies).forEach((body) => body.remove());",
  "重试失败分类",
  "show_hvut_runtime_failure_report(render_hvut_armory_integrate_failure_log(evidence));",
  "$equip.list.table(table, true, page.facts)",
  "$armory.script.commitBatch(result.stages.map((stage) => stage.facts), $armory.pageContext.screen);",
  "body.dataset.hvutArmoryLoading",
]);
if (hvut.includes("Promise.all($armory.filters.map((filter) => $armory.integrate.load")) {
  violations.push(`${hvutTarget} must not retain the destructive parallel Armory loader`);
}
for (const forbidden of ["$armory.page.init(page.doc", "Object.assign(dynjs_eqstore,"]) {
  if (hvut.includes(forbidden)) {
    violations.push(`${hvutTarget} must not stage through a detached page lifetime: ${forbidden}`);
  }
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
  "[verify-hvut-armory-integrate-boundary] OK - Armory loading is visible and serialized while fact commit stays atomic"
);
