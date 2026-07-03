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
  /var record_hvut_character_parse_failure = function \(stage, detail\) \{[\s\S]*?\n  var parse_hvut_inventory_capacity/.exec(
    text,
  )?.[0] || "";
const dfctSetButton = /dfct\.set_button = function \(doc\) \{[\s\S]*?\n  \};\n\};\n\n\/\/ \$persona/.exec(text)?.[0] || "";
const personaInit = /persona\.init = function \(\) \{[\s\S]*?\n  \};\n  persona\.create/.exec(text)?.[0] || "";
const personaCheckP = /persona\.check_p = function \(doc\) \{[\s\S]*?\n  \};\n  persona\.check_e/.exec(text)?.[0] || "";
const personaCheckE = /persona\.check_e = function \(doc\) \{[\s\S]*?\n  \};\n  persona\.change_p/.exec(text)?.[0] || "";
const personaChangeP = /persona\.change_p = async function \(pset\) \{[\s\S]*?\n  \};\n  persona\.change_e/.exec(text)?.[0] || "";
const personaChangeE = /persona\.change_e = async function \(eset\) \{[\s\S]*?\n  \};\n  persona\.set_button/.exec(text)?.[0] || "";

for (const [label, body] of [
  ["character parse helper", helperRegion],
  ["dfct.set_button", dfctSetButton],
  ["persona.init", personaInit],
  ["persona.check_p", personaCheckP],
  ["persona.check_e", personaCheckE],
  ["persona.change_p", personaChangeP],
  ["persona.change_e", personaChangeE],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

for (const required of [
  "sessionStorage.setItem('HVAA:lastHvutCharacterParseFailure', JSON.stringify(evidence));",
  "var parse_hvut_difficulty_from_level_readout = function (doc, stage) {",
  "return match ? match[1] : record_hvut_character_parse_failure(stage, { text: text });",
  "var parse_hvut_persona_form_state = function (doc, stage) {",
  "return record_hvut_character_parse_failure(stage, { reason: 'personaFormMissing' });",
  "var parse_hvut_equip_set_state = function (doc, stage) {",
  "return record_hvut_character_parse_failure(stage, {",
]) {
  requirePart("character parse helper", helperRegion, required);
}

requirePart("dfct.set_button", dfctSetButton, "const value = parse_hvut_difficulty_from_level_readout(doc, 'difficultyLevelReadout');");
requirePart("dfct.set_button", dfctSetButton, "if (value === null) {");
requirePart("dfct.set_button", dfctSetButton, "if (dfct.selector) {\n        dfct.selector.disabled = false;");
requirePart("dfct.set_button", dfctSetButton, "return false;");

requirePart("persona.init", personaInit, "const personaCheck = persona.check_p();");
requirePart("persona.init", personaInit, "if (personaCheck === null) {\n        return false;");
requirePart("persona.check_p", personaCheckP, "const state = parse_hvut_persona_form_state(doc, 'personaFormState');");
requirePart("persona.check_p", personaCheckP, "if (state === null) {\n      return null;");
requirePart("persona.check_p", personaCheckP, "if (persona.set_value() === false) return null;");
requirePart("persona.check_e", personaCheckE, "const state = parse_hvut_equip_set_state(doc, 'personaEquipSetState');");
requirePart("persona.check_e", personaCheckE, "if (state === null) {\n      return false;");
requirePart("persona.check_e", personaCheckE, "return persona.set_value();");
requirePart("persona.change_p", personaChangeP, "if (persona.check_p(doc) === null) {");
requirePart("persona.change_p", personaChangeP, "if ((await persona.change_e()) === false) return false;");
requirePart("persona.change_p", personaChangeP, "if (ctx.dfct.set_button(doc) === false) return false;");
requirePart("persona.change_e", personaChangeE, "if (persona.check_e(doc) === false) {");
requirePart("persona.change_e", personaChangeE, "if (persona.selector_e) persona.selector_e.disabled = false;");

for (const required of [
  "if ($persona.check_e() === false) return;",
]) {
  const count = (text.match(new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  if (count !== 2) violations.push(`${target} must guard both direct persona.check_e calls, found ${count}`);
}

for (const forbidden of [
  "const value = /^(.+) Lv\\.(\\d+)/.exec($id('level_readout', doc).textContent.trim())[1];",
  "const eset = parseInt($qs('img[src$=\"_on.png\"]', doc).src.match(/set(\\d+)_on/)[1]);",
  "persona.check_p(doc);\n    if (persona.selector_p)",
  "persona.check_e(doc);\n    const json = persona.json;",
  "ctx.dfct.set_button(doc);\n  };",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unsafe character parse path: ${forbidden}`);
  }
}

for (const required of [
  'HVUT_CHARACTER_PARSE_FAILURE: "HVAA:lastHvutCharacterParseFailure"',
  'source("hvutCharacterParseFailure", DiagnosticEvidenceKey.HVUT_CHARACTER_PARSE_FAILURE)',
]) {
  if (!diagnosticText.includes(required)) {
    violations.push(`${diagnosticTarget} must include ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-character-parse-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-character-parse-boundary] OK - Character parse failures fail closed with evidence");
