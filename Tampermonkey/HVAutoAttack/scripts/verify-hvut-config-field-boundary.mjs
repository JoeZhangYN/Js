import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const mainTarget = path.normalize("src/main.js");
const fieldTarget = path.normalize("src/i18n/hvut-config-field.js");
const fieldBridgeTarget = path.normalize("src/i18n/hvut-config-field-bridge.js");
const fieldTestTarget = path.normalize("src/i18n/hvut-config-field.test.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const mainText = fs.readFileSync(path.join(root, mainTarget), "utf8");
const fieldText = fs.readFileSync(path.join(root, fieldTarget), "utf8");
const fieldBridgeText = fs.readFileSync(path.join(root, fieldBridgeTarget), "utf8");
const fieldTestText = fs.readFileSync(path.join(root, fieldTestTarget), "utf8");
const violations = [];

function requireIncludes(file, body, parts) {
  for (const part of parts) {
    if (!body.includes(part)) violations.push(`${file} must include ${part}`);
  }
}

requireIncludes(fieldTarget, fieldText, [
  "export function isHvutConfigFieldDisabled(field, context) {",
  "context?.isIsekai",
  "field?.server && field.server !== context.serverName",
  "field?.disabled === \"persistent\"",
  "field?.disabled === \"isekai\"",
]);

requireIncludes(fieldBridgeTarget, fieldBridgeText, [
  "import { isHvutConfigFieldDisabled } from \"./hvut-config-field.js\";",
  "window.HVAA_hvutConfigField = Object.freeze({",
  "isDisabled: isHvutConfigFieldDisabled",
]);

if (!mainText.includes("import \"./i18n/hvut-config-field-bridge.js\";")) {
  violations.push(`${mainTarget} must load HVUT config field bridge before hv-utils`);
}

requireIncludes(target, text, [
  "var is_hvut_config_field_disabled = function (field, context) {",
  "window.HVAA_hvutConfigField.isDisabled(field, context)",
  "record_hvut_config_parse_failure('configFieldBridgeMissing'",
  "return true;",
  "if (is_hvut_config_field_disabled(o, { isIsekai: IS_ISEKAI, serverName: _server.name })) {",
  "skipField: (o) => is_hvut_config_field_disabled(o, { isIsekai: IS_ISEKAI, serverName: _server.name })",
]);

for (const forbidden of [
  "o.server && o.server !== _server.name",
  "o.disabled === 'persistent' && !IS_ISEKAI || o.disabled === 'isekai' && IS_ISEKAI",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not reimplement config field applicability with ${forbidden}`);
  }
}

if (
  !fieldTestText.includes("uses server ownership for Isekai config fields") ||
  !fieldTestText.includes("uses disabled flags for persistent config fields")
) {
  violations.push(`${fieldTestTarget} must cover Isekai and persistent config field applicability`);
}

if (violations.length) {
  console.error("[verify-hvut-config-field-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-config-field-boundary] OK - config field applicability is behind one decision");
