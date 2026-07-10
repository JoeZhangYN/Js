import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvutTarget = path.normalize("src/i18n/hv-utils.js");
const factsTarget = path.normalize("src/i18n/hvut-armory-page-facts.js");
const factsTestTarget = path.normalize("src/i18n/hvut-armory-page-facts.test.js");
const readerTarget = path.normalize("src/i18n/hvut-armory-page-reader.js");
const diagnosticTarget = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTestTarget = path.normalize("src/core/diagnostic-evidence.test.js");
const read = (target) => fs.readFileSync(path.join(root, target), "utf8");
const hvut = read(hvutTarget);
const facts = read(factsTarget);
const factsTest = read(factsTestTarget);
const reader = read(readerTarget);
const diagnostic = read(diagnosticTarget);
const diagnosticTest = read(diagnosticTestTarget);
const violations = [];

function requireAll(target, text, needles) {
  for (const needle of needles) {
    if (!text.includes(needle)) violations.push(`${target} must include ${needle}`);
  }
}

requireAll(factsTarget, facts, [
  "export function readArmoryPageFacts(doc, screen)",
  "const hasEquipment = rows.length > 0;",
  "if (!hasEquipment) return { kind: ArmoryPageFactsKind.FACTS, facts: emptyFacts() };",
  'stage: "scriptObjectMissing"',
  'hasEquipment && screen !== "sell"',
  'screen === "sell" && !Object.keys(facts.eqitems).length',
]);
for (const forbidden of ["eval(", "new Function("]) {
  if (facts.includes(forbidden)) {
    violations.push(
      `${factsTarget} must parse detached page facts without executing scripts: ${forbidden}`
    );
  }
}

requireAll(readerTarget, reader, [
  'import { ArmoryPageFactsKind, readArmoryPageFacts } from "./hvut-armory-page-facts.js";',
  "facts: pageFacts.facts",
  "pageFactFailures: pageFacts.failures",
  "recordFailure?.(failure.stage",
  "readArmoryPageFacts(doc, screen)",
]);
if (reader.includes('searchParams.get("screen")')) {
  violations.push(
    `${readerTarget} must consume the typed screen identity instead of rediscovering it`
  );
}

requireAll(hvutTarget, hvut, [
  "const pageFacts = $armory.script.read(doc, screen);",
  "window.HVAA_armoryIntegration",
  "bridge.readPageFacts(doc, screen)",
  "record_hvut_armory_page_failure(failure.stage",
  "commitBatch: function (pages, screen)",
  "$armory.script.publish(facts);",
  "$armory.script.commit(facts, screen);",
  "$equip.list.table(table, true, page.facts)",
  "result.stages.map((stage) => stage.facts)",
]);
for (const forbidden of [
  "if (typeof dynjs_eqstore === 'undefined') { dynjs_eqstore = {}; }",
  "Object.assign(dynjs_eqstore,",
  "$armory.script.assign(",
  "$armory.page.init(page.doc",
]) {
  if (hvut.includes(forbidden)) {
    violations.push(`${hvutTarget} must not borrow or recreate detached page scope: ${forbidden}`);
  }
}

requireAll(factsTestTarget, factsTest, [
  "without executing or borrowing the detached page scope",
  "expect(globalThis.__armoryScriptExecuted).toBeUndefined()",
  "treats an empty salvage category as a valid empty fact lifetime",
  "rejects missing salvage facts only when equipment needs them",
]);

requireAll(diagnosticTarget, diagnostic, [
  'HVUT_ARMORY_PAGE_FAILURE: "HVAA:lastHvutArmoryPageFailure"',
  'source("hvutArmoryPageFailure", DiagnosticEvidenceKey.HVUT_ARMORY_PAGE_FAILURE)',
]);
requireAll(diagnosticTestTarget, diagnosticTest, [
  "HVAA:lastHvutArmoryPageFailure",
  "hvutArmoryPageFailure",
  'capability: "hvutArmoryPage"',
]);

if (violations.length) {
  console.error("[verify-hvut-armory-page-parse-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-armory-page-parse-boundary] OK - detached Armory facts keep an owned lifetime through commit"
);
