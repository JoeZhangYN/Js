import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const diagnosticTarget = path.normalize("src/core/diagnostic-evidence-keys.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const diagnosticText = fs.readFileSync(path.join(root, diagnosticTarget), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const helperRegion =
  /var record_hvut_shrine_capacity_failure = function \(stage, detail\) \{[\s\S]*?\n  var reloadCurrentPage/.exec(
    text,
  )?.[0] || "";
const modernShrine =
  /if \(get_hvut_bazaar_page_context\(\)\.isShrine\) \{[\s\S]*?\/\/ \[END 8\] Bazaar - The Shrine/.exec(
    text,
  )?.[0] || "";
const legacyShrine =
  /if \(get_hvut_bazaar_page_context\(\)\.isShrine\) \{[\s\S]*?\/\/ \[END 10\] Bazaar - The Shrine/.exec(
    text.slice(text.indexOf("//* [10] Bazaar - The Shrine")),
  )?.[0] || "";

if (!helperRegion) violations.push(`${target} must keep Shrine capacity helper visible`);
if (!modernShrine) violations.push(`${target} must keep modern Shrine entry visible`);
if (!legacyShrine) violations.push(`${target} must keep legacy Shrine entry visible`);

for (const required of [
  "sessionStorage.setItem('HVAA:lastHvutShrineCapacityFailure', JSON.stringify(evidence));",
  "var parse_hvut_inventory_capacity = function (html, stage) {",
  "return record_hvut_shrine_capacity_failure(stage, { reason: 'inventoryCapacityMissing' });",
  "var update_hvut_shrine_equip_total = function (equip, baseKey) {",
  "equip.total = null;",
  "var is_hvut_shrine_equip_capacity_full = function (equip) {",
  "equip.capacity > 0 && equip.total >= equip.capacity",
  "var set_hvut_shrine_stop_error = function (state, message, evidence) {",
  "state.errorEvidence = evidence || null;",
]) {
  requirePart("Shrine capacity helper", helperRegion, required);
}

for (const [label, body, baseKey, stage] of [
  ["modern Shrine", modernShrine, "usage", "shrineInventoryCapacity"],
  ["legacy Shrine", legacyShrine, "current", "legacyShrineInventoryCapacity"],
]) {
  requirePart(label, body, "capacity: null");
  requirePart(label, body, "total: null");
  requirePart(label, body, `const capacity = parse_hvut_inventory_capacity(html, '${stage}');`);
  requirePart(label, body, `const total = update_hvut_shrine_equip_total(_ss.equip, '${baseKey}');`);
  requirePart(label, body, "if (is_hvut_shrine_equip_capacity_full(_ss.equip)) {");
  requirePart(label, body, "const evidence = record_hvut_shrine_offer_failure(");
  requirePart(label, body, "set_hvut_shrine_stop_error(_ss, '你的装备库存已满', evidence);");
  requirePart(label, body, "unavailable");
}

for (const forbidden of [
  "_ss.equip = { capacity: 0",
  "_ss.equip.total = _ss.equip.usage + _ss.equip.received - _ss.equip.sold - _ss.equip.salvaged;",
  "_ss.equip.total = _ss.equip.current + _ss.equip.received - _ss.equip.sold - _ss.equip.salvaged;",
  "if (_ss.equip.total >= _ss.equip.capacity) {",
  "_ss.error = msg;",
  "_ss.error = '你的装备库存已满';",
  "var set_hvut_shrine_stop_error = function (state, message) {",
  "set_hvut_shrine_stop_error(_ss, '你的装备库存已满');",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unsafe Shrine capacity path: ${forbidden}`);
  }
}

for (const required of [
  'HVUT_SHRINE_CAPACITY_FAILURE: "HVAA:lastHvutShrineCapacityFailure"',
  'source("hvutShrineCapacityFailure", DiagnosticEvidenceKey.HVUT_SHRINE_CAPACITY_FAILURE)',
]) {
  if (!diagnosticText.includes(required)) {
    violations.push(`${diagnosticTarget} must include ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-shrine-capacity-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-shrine-capacity-boundary] OK - Shrine only reports full with known capacity");
