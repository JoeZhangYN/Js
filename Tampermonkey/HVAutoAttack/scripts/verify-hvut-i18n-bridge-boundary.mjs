import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const diagnosticKeysText = fs.readFileSync(path.join(root, diagnosticKeys), "utf8");
const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
const violations = [];

for (const required of [
  "var record_hvut_i18n_bridge_failure = function (stage, detail) {",
  "capability: 'hvutI18nBridge'",
  "sessionStorage.setItem('HVAA:lastHvutI18nBridgeFailure'",
  "console.warn('[HVAA] HVUT i18n bridge failed', evidence)",
  "var run_hvut_i18n_bridge = function (method, args, stage, detail, fallback) {",
  "var bridge = typeof window !== 'undefined' ? window.HVAA_i18n : undefined;",
  "if (!bridge || typeof bridge[method] !== 'function') {",
  "record_hvut_i18n_bridge_failure(stage, detail || {});",
  "return bridge[method](...(args || []));",
  "record_hvut_i18n_bridge_failure(stage + 'Failed'",
  "return run_hvut_i18n_bridge('resolveEn', [node, group], 'resolveEnBridgeMissing'",
  "var HVUT_ITEM_IDENTITY_GROUPS = Object.freeze(['items', 'artifact']);",
  "var read_hvut_dom_identity = function (source, group) {",
  "var observed = (typeof source === 'string' ? source : source?.textContent || '').trim();",
  "var canonical = (resolveEn(source, group) ?? observed).trim();",
  "return { canonical: canonical, observed: observed };",
  "return run_hvut_i18n_bridge('t', [value, group], 'translateBridgeMissing'",
  "return run_hvut_i18n_bridge('translateText', [value, group], 'translateTextBridgeMissing'",
  "return run_hvut_i18n_bridge('navigationLinks', [], 'navigationRegistryBridgeMissing'",
  "return run_hvut_i18n_bridge('translateEquipName', [name], 'translateEquipNameBridgeMissing'",
  "var registered = run_hvut_i18n_bridge('registerI18nRender', [node, bound], 'registerI18nRenderBridgeMissing'",
  "run_hvut_i18n_bridge('retranslateEquiplist', [], 'retranslateEquiplistBridgeMissing', { surface: 'armoryIntegrate' }, false)",
  "run_hvut_i18n_bridge('recordI18nInitFailure', ['hv-utils', e], 'recordI18nInitFailureBridgeMissing'",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep HVUT i18n bridge boundary: ${required}`);
  }
}

for (const required of [
  "read_hvut_dom_identity(cell, HVUT_ITEM_IDENTITY_GROUPS)",
  "read_hvut_dom_identity(nameNode, 'ability')",
  "read_hvut_dom_identity(nameCell, 'trains')",
  "read_hvut_dom_identity(row.cells[3], 'mm').canonical",
  "read_hvut_dom_identity(cells[0], HVUT_ITEM_IDENTITY_GROUPS)",
  "read_hvut_dom_identity(nameCell, 'characterStatus')",
  "read_hvut_dom_identity(table.previousElementSibling, 'characterStatus').canonical",
  "read_hvut_dom_identity(row.children?.[0], 'character').canonical",
  "read_hvut_dom_identity(levelExec[1], 'difficulty').canonical",
  "read_hvut_dom_identity(conditionText, 'stamina').canonical",
  "read_hvut_dom_identity(tr.cells[1], HVUT_ITEM_IDENTITY_GROUPS).canonical",
  "read_hvut_dom_identity(td, HVUT_ITEM_IDENTITY_GROUPS).canonical",
  "read_hvut_dom_identity(div, HVUT_ITEM_IDENTITY_GROUPS).canonical",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must normalize translated DOM identity through ${required}`);
  }
}

for (const forbidden of [
  "var name = cell?.textContent?.trim() || '';",
  "var name = row?.cells?.[0]?.textContent?.trim() || '';",
  "var observedName = (nameNode?.textContent || '').trim();",
  "var name = (resolveEn(nameNode, 'ability') ?? observedName).trim();",
  "let read = row.cells[3].textContent;",
  "var name = cells[0]?.textContent || '';",
  "const type = table.previousElementSibling.textContent;",
  "let name = tr.cells[1].textContent;",
  "const slot = row.children?.[0]?.textContent || '';",
  "const name = div.textContent;",
  ".map((td) => td.textContent)",
]) {
  if (text.includes(forbidden)) {
    violations.push(
      `${target} must not use translated DOM text as canonical identity: ${forbidden}`
    );
  }
}

for (const forbidden of [
  "window.HVAA_i18n.resolveEn(node, group)",
  "window.HVAA_i18n.t(value, group)",
  "window.HVAA_i18n.translateEquipName(name)",
  "window.HVAA_i18n.registerI18nRender(node, bound)",
  "window.HVAA_i18n.retranslateEquiplist()",
  "window.HVAA_i18n.recordI18nInitFailure('hv-utils', e)",
]) {
  if (text.includes(forbidden)) {
    violations.push(
      `${target} must not call HVAA_i18n directly outside the bridge command: ${forbidden}`
    );
  }
}

for (const required of [
  'HVUT_I18N_BRIDGE_FAILURE: "HVAA:lastHvutI18nBridgeFailure"',
  'source("hvutI18nBridgeFailure", DiagnosticEvidenceKey.HVUT_I18N_BRIDGE_FAILURE)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${diagnosticKeys} must expose ${required}`);
  }
}

for (const required of ["HVAA:lastHvutI18nBridgeFailure"]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${diagnosticTest} must cover ${required}`);
  }
}
if (
  !/hvutI18nBridgeFailure:\s*\{[\s\S]*capability:\s*"hvutI18nBridge"[\s\S]*stage:\s*"retranslateEquiplistBridgeMissing"[\s\S]*\}/.test(
    diagnosticTestText
  )
) {
  violations.push(
    `${diagnosticTest} must cover hvutI18nBridgeFailure retranslateEquiplistBridgeMissing evidence`
  );
}

if (violations.length) {
  console.error("[verify-hvut-i18n-bridge-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-i18n-bridge-boundary] OK - HVUT i18n bridge failures are persisted");
