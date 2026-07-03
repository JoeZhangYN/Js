import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const helperRegion =
  /var record_hvut_ability_parse_failure = function \(stage, detail\) \{[\s\S]*?\n  var reloadCurrentPage/.exec(text)?.[0] || "";
const modernInit =
  /_ab\.init = function \(\) \{[\s\S]*?\n  \};\n\n  _ab\.parse_slotbar/.exec(text)?.[0] || "";
const modernSlotbar =
  /_ab\.parse_slotbar = function \(\) \{[\s\S]*?\n  \};\n\n  _ab\.parse_treepane/.exec(text)?.[0] || "";
const modernTreepane =
  /_ab\.parse_treepane = function \(\) \{[\s\S]*?\n  \};\n\n  _ab\.click/.exec(text)?.[0] || "";
const abilityRegions = [
  ...text.matchAll(/_ab\.point = parse_hvut_ability_points_from_top\(\$id\('ability_top'\)[\s\S]*?\n\} else\n\/\/ \[END 3\] Character - Abilities/g),
].map((match) => match[0]);
const legacyRegion = abilityRegions[1] || "";

for (const [label, body] of [
  ["ability parse helper", helperRegion],
  ["modern ability init", modernInit],
  ["modern ability slotbar parser", modernSlotbar],
  ["modern ability treepane parser", modernTreepane],
  ["legacy ability region", legacyRegion],
]) {
if (!body) violations.push(`${target} must keep ${label} visible`);
}

if (abilityRegions.length !== 2) {
  violations.push(`${target} must keep exactly two HVUT ability page regions, found ${abilityRegions.length}`);
}

for (const required of [
  "sessionStorage.setItem('HVAA:lastHvutAbilityParseFailure', JSON.stringify(evidence));",
  "var parse_hvut_ability_points = function (text) {",
  "var parse_hvut_ability_button_type = function (backgroundImage) {",
  "var parse_hvut_ability_points_from_top = function (top, stage) {",
  "record_hvut_ability_parse_failure(stage, { reason: 'abilityPointNodeMissing' })",
  "var parse_hvut_ability_button_panel = function (div, stage) {",
  "record_hvut_ability_parse_failure(stage, { reason: 'abilityButtonPanelMissing'",
  "var parse_hvut_ability_unlock_id = function (panel, stage) {",
  "record_hvut_ability_parse_failure(stage, { onclick: onclick });",
  "var mark_hvut_ability_warning = function (div, warn, stage) {",
  "record_hvut_ability_parse_failure(stage, { reason: 'abilityWarningNodeMissing'",
  "return match ? parseInt(match[1]) : record_hvut_ability_parse_failure('abilityPoints'",
  "return match ? match[1] : record_hvut_ability_parse_failure('abilityButtonType'",
]) {
  requirePart("ability parse helper", helperRegion, required);
}

for (const required of [
  "if (_ab.point === null) {",
  "if (_ab.parse_slotbar() === false) {",
  "if (!$config.set('ab_level', _ab.level)) {",
  "if (_ab.parse_treepane() === false) {",
  "return false;",
]) {
  requirePart("modern ability init", modernInit, required);
}

for (const required of [
  "for (const div of $qsa('#ability_top div[onmouseover*=\"overability\"]')) {",
  "record_hvut_ability_parse_failure('abilitySlotbar'",
  "return false;",
  "continue;",
  "return true;",
]) {
  requirePart("modern ability slotbar parser", modernSlotbar, required);
}

for (const required of [
  "for (const div of $qsa('#ability_treepane > div')) {",
  "const buttonPanel = parse_hvut_ability_button_panel(div, 'abilityButtonPanel');",
  "ab.id = parse_hvut_ability_unlock_id(buttonPanel, 'abilityUnlockId');",
  "for (const [i, button] of Array.from(buttonPanel.children).entries()) {",
  "const type = parse_hvut_ability_button_type(button.style.backgroundImage);",
  "if (type === null) return false;",
  "mark_hvut_ability_warning(div, '未激活', 'abilityWarningNode')",
  "mark_hvut_ability_warning(div, '可升级', 'abilityWarningNode')",
  "continue;",
  "return true;",
]) {
  requirePart("modern ability treepane parser", modernTreepane, required);
}

for (const required of [
  "_ab.point = parse_hvut_ability_points_from_top($id('ability_top'), 'legacyAbilityPointsNode');",
  "if (_ab.point === null) {",
  "for (const div of $qsa('#ability_top div[onmouseover*=\"overability\"]')) {",
  "record_hvut_ability_parse_failure('abilitySlotbar'",
  "const buttonPanel = parse_hvut_ability_button_panel(div, 'legacyAbilityButtonPanel');",
  "ab.id = parse_hvut_ability_unlock_id(buttonPanel, 'legacyAbilityUnlockId');",
  "for (const [i, button] of Array.from(buttonPanel.children).entries()) {",
  "const type = parse_hvut_ability_button_type(button.style.backgroundImage);",
  "if (type === null) {",
  "mark_hvut_ability_warning(div, '未激活', 'legacyAbilityWarningNode')",
  "mark_hvut_ability_warning(div, '可升级', 'legacyAbilityWarningNode')",
]) {
  requirePart("legacy ability region", legacyRegion, required);
}

for (const forbidden of [
  "parseInt(/Ability Points: (\\d+)/.exec($id('ability_top').children[3].textContent)[1])",
  "const type = /(.)\\.png/.exec(button.style.backgroundImage)[1];",
  "$qsa('#ability_top div[onmouseover*=\"overability\"]').forEach((div) => {",
  "$qsa('#ability_treepane > div').forEach((div) => {",
  "$id('ability_top').children[3].textContent",
  "div.children[2].getAttribute('onclick')",
  "Array.from(div.children[2].children)",
  "div.firstElementChild.firstElementChild.classList.add('hvut-ab-warn')",
  "div.firstElementChild.firstElementChild.dataset.warn",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unchecked ability parse path: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-ability-parse-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-ability-parse-boundary] OK - ability parse failures fail closed with evidence");
