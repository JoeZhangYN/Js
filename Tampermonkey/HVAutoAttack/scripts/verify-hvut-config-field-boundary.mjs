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
  "export function formatHvutConfigFieldHelpText(text) {",
  "return text.trim().replace(/^ +/gm, \"\").replace(/\\n/g, \"<br>\");",
  "export function formatHvutConfigFieldDescription(description) {",
  "button: lines[0]",
  "html: lines.slice(1).join(\"<br>\")",
]);

requireIncludes(fieldBridgeTarget, fieldBridgeText, [
  "formatHvutConfigFieldDescription",
  "formatHvutConfigFieldHelpText",
  "getHvutConfigFieldInputKind",
  "isHvutConfigFieldDisabled",
  "from \"./hvut-config-field.js\";",
  "window.HVAA_hvutConfigField = Object.freeze({",
  "formatDescription: formatHvutConfigFieldDescription",
  "formatHelpText: formatHvutConfigFieldHelpText",
  "inputKind: getHvutConfigFieldInputKind",
  "isDisabled: isHvutConfigFieldDisabled",
]);

if (!mainText.includes("import \"./i18n/hvut-config-field-bridge.js\";")) {
  violations.push(`${mainTarget} must load HVUT config field bridge before hv-utils`);
}

requireIncludes(target, text, [
  "var is_hvut_config_field_disabled = function (field, context) {",
  "var get_hvut_config_field_input_kind = function (field) {",
  "var format_hvut_config_field_help_text = function (text) {",
  "var format_hvut_config_field_description = function (desc) {",
  "window.HVAA_hvutConfigField.isDisabled(field, context)",
  "window.HVAA_hvutConfigField.inputKind(field)",
  "window.HVAA_hvutConfigField.formatHelpText(text)",
  "window.HVAA_hvutConfigField.formatDescription(desc)",
  "record_hvut_config_parse_failure('configFieldBridgeMissing'",
  "record_hvut_config_parse_failure('configFieldInputKindBridgeMissing'",
  "record_hvut_config_parse_failure('configFieldHelpTextBridgeMissing'",
  "record_hvut_config_parse_failure('configFieldDescriptionBridgeMissing'",
  "return true;",
  "var render_hvut_config_field_row = function (config, field, context) {",
  "const inputKind = get_hvut_config_field_input_kind(field);",
  "field.node.div = $element('div', config.node.div);",
  "field.node.input = context?.checkboxWithNullLabel",
  "? $input(['checkbox', null, field.label], field.node.div)",
  ": $input(['checkbox', field.label], field.node.div);",
  "if (inputKind === 'textarea' && context?.showTextareaDefaultButton) {",
  "$input(['button', '恢复默认'], field.node.div, null, () => { config.set_input(field); });",
  "text = format_hvut_config_field_help_text(text);",
  "desc = format_hvut_config_field_description(desc);",
  "$input(['button', desc.button], field.node.div",
  "field.node.desc = $element('p', field.node.div, ['/' + desc.html, '.hvut-none']);",
  "field.node.input.dataset.key = field.key;",
  "if (is_hvut_config_field_disabled(field, { isIsekai: isIsekai, serverName: _server.name })) {",
  "var render_hvut_config_panel = function (config, context) {",
  "config.node.div = $element('div', null, ['.hvut-cfg-div'], { change: config.validate_panel });",
  "$element('header', config.node.div, 'HV Utils 设置');",
  "config.data.forEach((field) => {",
  "render_hvut_config_field_row(config, field, context);",
  "const bottom = $element('footer', config.node.div);",
  "$input(['button', '保存'], bottom, null, () => { config.save(true); });",
  "$input(['button', '关闭'], bottom, null, () => { config.close(); });",
  "$input(['button', '恢复'], bottom, null, () => { config.load(config.settings); });",
  "$input(['button', '恢复默认'], bottom, null, () => { config.load(config.default); });",
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
  const expectedCall =
    index === 0
      ? "render_hvut_config_panel($config, {\n      checkboxWithNullLabel: true,\n      isIsekai: IS_ISEKAI,\n      showTextareaDefaultButton: true,\n    });"
      : "render_hvut_config_panel($config, { isIsekai: IS_ISEKAI });";
  requireIncludes(target, body, [expectedCall]);
  for (const forbidden of [
    "$config.node = {};",
    "$config.node.div = $element('div', null, ['.hvut-cfg-div'], { change: $config.validate_panel });",
    "$element('header', $config.node.div, 'HV Utils 设置');",
    "$config.data.forEach((o) => {",
    "render_hvut_config_field_row($config, o",
    "const bottom = $element('footer', $config.node.div);",
    "$input(['button', '保存'], bottom, null, () => { $config.save(true); });",
    "const inputKind = get_hvut_config_field_input_kind(o);",
    "if (inputKind === 'textarea')",
    "else if (inputKind === 'select')",
    "else if (inputKind === 'checkbox')",
    "else if (inputKind === 'number')",
    "o.node.input.dataset.key = o.key;",
    "if (is_hvut_config_field_disabled(o, { isIsekai: IS_ISEKAI, serverName: _server.name })) {",
    "if (o.input === 'textarea')",
    "else if (o.input === 'select')",
    "else if (o.type === 'boolean')",
    "else if (o.type === 'number')",
    "text.trim().replace(/^ +/gm, '').replace(/\\n/g, '<br>')",
    "desc.trim().replace(/^ +/gm, '').split('\\n')",
    "desc.slice(1).join('<br>')",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} config create[${index}] must not reimplement input kind with ${forbidden}`);
    }
  }
}

if (
  !fieldTestText.includes("uses server ownership for Isekai config fields") ||
  !fieldTestText.includes("uses disabled flags for persistent config fields") ||
  !fieldTestText.includes("classifies config field input kind once") ||
  !fieldTestText.includes("formats field help text once") ||
  !fieldTestText.includes("formats field descriptions into button and html once")
) {
  violations.push(`${fieldTestTarget} must cover Isekai and persistent config field applicability`);
}

if (violations.length) {
  console.error("[verify-hvut-config-field-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-config-field-boundary] OK - config field applicability is behind one decision");
