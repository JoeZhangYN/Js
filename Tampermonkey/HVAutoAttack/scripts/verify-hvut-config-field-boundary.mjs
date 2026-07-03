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
  "export function getHvutConfigFieldInputKind(field) {",
  "if (field?.input === \"textarea\") return \"textarea\";",
  "if (field?.input === \"select\") return \"select\";",
  "if (field?.type === \"boolean\") return \"checkbox\";",
  "if (field?.type === \"number\") return \"number\";",
  "return \"text\";",
]);

requireIncludes(fieldBridgeTarget, fieldBridgeText, [
  "getHvutConfigFieldInputKind",
  "isHvutConfigFieldDisabled",
  "from \"./hvut-config-field.js\";",
  "window.HVAA_hvutConfigField = Object.freeze({",
  "inputKind: getHvutConfigFieldInputKind",
  "isDisabled: isHvutConfigFieldDisabled",
]);

if (!mainText.includes("import \"./i18n/hvut-config-field-bridge.js\";")) {
  violations.push(`${mainTarget} must load HVUT config field bridge before hv-utils`);
}

requireIncludes(target, text, [
  "var is_hvut_config_field_disabled = function (field, context) {",
  "var get_hvut_config_field_input_kind = function (field) {",
  "window.HVAA_hvutConfigField.isDisabled(field, context)",
  "window.HVAA_hvutConfigField.inputKind(field)",
  "record_hvut_config_parse_failure('configFieldBridgeMissing'",
  "record_hvut_config_parse_failure('configFieldInputKindBridgeMissing'",
  "return true;",
  "const inputKind = get_hvut_config_field_input_kind(o);",
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

const createBodies = [...text.matchAll(/create: function \(\) \{[\s\S]*?\n  \},\n  \/\/ open\/close/g)].map(
  (match) => match[0]
);
if (createBodies.length !== 2) violations.push(`${target} must keep both config create entries visible`);
for (const [index, body] of createBodies.entries()) {
  requireIncludes(target, body, [
    "const inputKind = get_hvut_config_field_input_kind(o);",
    "if (inputKind === 'textarea')",
    "else if (inputKind === 'select')",
    "else if (inputKind === 'checkbox')",
    "else if (inputKind === 'number')",
  ]);
  for (const forbidden of [
    "if (o.input === 'textarea')",
    "else if (o.input === 'select')",
    "else if (o.type === 'boolean')",
    "else if (o.type === 'number')",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} config create[${index}] must not reimplement input kind with ${forbidden}`);
    }
  }
}

if (
  !fieldTestText.includes("uses server ownership for Isekai config fields") ||
  !fieldTestText.includes("uses disabled flags for persistent config fields") ||
  !fieldTestText.includes("classifies config field input kind once")
) {
  violations.push(`${fieldTestTarget} must cover Isekai and persistent config field applicability`);
}

if (violations.length) {
  console.error("[verify-hvut-config-field-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-config-field-boundary] OK - config field applicability is behind one decision");
