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
  /var create_hvut_character_parse_evidence = function \(stage, detail\) \{[\s\S]*?\n  var parse_hvut_inventory_capacity/.exec(
    text,
  )?.[0] || "";
const dfctSetButtonOutcome =
  /dfct\.set_button_outcome = function \(doc\) \{[\s\S]*?\n  \};\n  dfct\.set_button/.exec(text)?.[0] || "";
const dfctSetButton = /dfct\.set_button = function \(doc\) \{[\s\S]*?\n  \};\n\};\n\n\/\/ \$persona/.exec(text)?.[0] || "";
const personaInitOutcome =
  /persona\.init_outcome = async function \(\) \{[\s\S]*?\n  \};\n  persona\.init/.exec(text)?.[0] || "";
const personaInit = /persona\.init = async function \(\) \{[\s\S]*?\n  \};\n  persona\.create/.exec(text)?.[0] || "";
const personaCheckPOutcome =
  /persona\.check_p_outcome = function \(doc\) \{[\s\S]*?\n  \};\n  persona\.check_p/.exec(text)?.[0] || "";
const personaCheckP = /persona\.check_p = function \(doc\) \{[\s\S]*?\n  \};\n  persona\.check_e_outcome/.exec(text)?.[0] || "";
const personaCheckEOutcome =
  /persona\.check_e_outcome = function \(doc\) \{[\s\S]*?\n  \};\n  persona\.check_e/.exec(text)?.[0] || "";
const personaCheckE = /persona\.check_e = function \(doc\) \{[\s\S]*?\n  \};\n  persona\.change_p/.exec(text)?.[0] || "";
const personaChangePOutcome =
  /persona\.change_p_outcome = async function \(pset\) \{[\s\S]*?\n  \};\n  persona\.change_p/.exec(text)?.[0] || "";
const personaChangeP = /persona\.change_p = async function \(pset\) \{[\s\S]*?\n  \};\n  persona\.change_e_outcome/.exec(text)?.[0] || "";
const personaChangeEOutcome =
  /persona\.change_e_outcome = async function \(eset\) \{[\s\S]*?\n  \};\n  persona\.change_e/.exec(text)?.[0] || "";
const personaChangeE = /persona\.change_e = async function \(eset\) \{[\s\S]*?\n  \};\n  persona\.set_button/.exec(text)?.[0] || "";
const equipPopupLoad = /_eq\.popup_load = function \(eq\) \{[\s\S]*?\n  \};\n\n  _eq\.charm_load/.exec(text)?.[0] || "";
const equipCharmAppend = /_eq\.charm_append = function \(eq\) \{[\s\S]*?\n  \};\n\n  if \(_query\.equip_slot\)/.exec(text)?.[0] || "";

for (const [label, body] of [
  ["character parse helper", helperRegion],
  ["dfct.set_button_outcome", dfctSetButtonOutcome],
  ["dfct.set_button", dfctSetButton],
  ["persona.init_outcome", personaInitOutcome],
  ["persona.init", personaInit],
  ["persona.check_p_outcome", personaCheckPOutcome],
  ["persona.check_p", personaCheckP],
  ["persona.check_e_outcome", personaCheckEOutcome],
  ["persona.check_e", personaCheckE],
  ["persona.change_p_outcome", personaChangePOutcome],
  ["persona.change_p", personaChangeP],
  ["persona.change_e_outcome", personaChangeEOutcome],
  ["persona.change_e", personaChangeE],
  ["_eq.popup_load", equipPopupLoad],
  ["_eq.charm_append", equipCharmAppend],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

for (const required of [
  "var create_hvut_character_parse_evidence = function (stage, detail) {",
  "sessionStorage.setItem('HVAA:lastHvutCharacterParseFailure', JSON.stringify(evidence));",
  "return evidence;",
  "var record_hvut_character_parse_failure = function (stage, detail) {",
  "create_hvut_character_parse_evidence(stage, detail);",
  "var reject_hvut_persona_sync = function (reason, detail) {",
  "return { kind: 'rejected', reason: reason, evidence: evidence };",
  "var reject_hvut_difficulty_refresh = function (reason, detail) {",
  "var render_hvut_equipment_persona_context = function (persona, stage) {",
  "var equipState = persona.check_e_outcome();",
  "if (equipState.kind === 'rejected') return equipState;",
  "return reject_hvut_persona_sync(stage, { reason: 'equipsetWriteRejected' });",
  "var parse_hvut_difficulty_from_level_readout = function (doc, stage) {",
  "return match ? match[1] : record_hvut_character_parse_failure(stage, { text: text });",
  "var parse_hvut_persona_form_state = function (doc, stage) {",
  "return record_hvut_character_parse_failure(stage, { reason: 'personaFormMissing' });",
  "var parse_hvut_equip_set_state = function (doc, stage) {",
  "return record_hvut_character_parse_failure(stage, {",
  "var clear_hvut_equip_popup_drop_info = function (doc, stage) {",
  "return record_hvut_character_parse_failure(stage, { reason: 'equipPopupDropInfoMissing' });",
  "var append_hvut_equip_popup_charms = function (doc, div, stage) {",
  "return record_hvut_character_parse_failure(stage, { reason: 'equipPopupBodyMissing' });",
  "var parse_hvut_character_base_stat_row = function (row, stage) {",
  "return record_hvut_character_parse_failure(stage, { reason: 'baseStatRowIncomplete'",
  "var decorate_hvut_equipment_base_stat_row = function (row, base, stage) {",
  "return record_hvut_character_parse_failure(stage, { reason: 'equipmentBaseStatNameMissing'",
]) {
  requirePart("character parse helper", helperRegion, required);
}

requirePart(
  "dfct.set_button_outcome",
  dfctSetButtonOutcome,
  "const value = parse_hvut_difficulty_from_level_readout(doc, 'difficultyLevelReadout');",
);
requirePart("dfct.set_button_outcome", dfctSetButtonOutcome, "if (value === null) {");
requirePart("dfct.set_button_outcome", dfctSetButtonOutcome, "if (dfct.selector) {\n        dfct.selector.disabled = false;");
requirePart("dfct.set_button_outcome", dfctSetButtonOutcome, "return reject_hvut_difficulty_refresh('difficultyLevelReadoutRejected', {});");
requirePart("dfct.set_button", dfctSetButton, "const outcome = dfct.set_button_outcome(doc);");
requirePart("dfct.set_button", dfctSetButton, "return outcome.kind === 'accepted';");

requirePart("persona.init_outcome", personaInitOutcome, "const personaCheck = persona.check_p_outcome();");
requirePart("persona.init_outcome", personaInitOutcome, "if (personaCheck.kind === 'rejected') return personaCheck;");
requirePart("persona.init_outcome", personaInitOutcome, "if (!personaCheck.checked) {");
requirePart("persona.init_outcome", personaInitOutcome, "const equipOutcome = await persona.change_e_outcome();");
requirePart("persona.init_outcome", personaInitOutcome, "if (equipOutcome.kind === 'rejected') return equipOutcome;");
requirePart("persona.init_outcome", personaInitOutcome, "const personaOutcome = await persona.change_p_outcome();");
requirePart("persona.init_outcome", personaInitOutcome, "if (personaOutcome.kind === 'rejected') return personaOutcome;");
requirePart("persona.init_outcome", personaInitOutcome, "persona.check_warning();");
requirePart("persona.init_outcome", personaInitOutcome, "persona.node.div.addEventListener('mouseenter', persona.create);");
requirePart("persona.init_outcome", personaInitOutcome, "return { kind: 'accepted' };");
requirePart("persona.init", personaInit, "const outcome = await persona.init_outcome();");
requirePart("persona.init", personaInit, "return outcome.kind === 'accepted';");
requirePart("persona.check_p_outcome", personaCheckPOutcome, "const state = parse_hvut_persona_form_state(doc, 'personaFormState');");
requirePart("persona.check_p_outcome", personaCheckPOutcome, "return reject_hvut_persona_sync('personaFormStateRejected', {});");
requirePart("persona.check_p_outcome", personaCheckPOutcome, "return reject_hvut_persona_sync('personaStateWriteRejected', {});");
requirePart("persona.check_p_outcome", personaCheckPOutcome, "return { kind: 'accepted', checked: checked };");
requirePart("persona.check_p", personaCheckP, "const outcome = persona.check_p_outcome(doc);");
requirePart("persona.check_p", personaCheckP, "return outcome.kind === 'accepted' ? outcome.checked : null;");
requirePart("persona.check_e_outcome", personaCheckEOutcome, "const state = parse_hvut_equip_set_state(doc, 'personaEquipSetState');");
requirePart("persona.check_e_outcome", personaCheckEOutcome, "return reject_hvut_persona_sync('personaEquipSetStateRejected', {});");
requirePart("persona.check_e_outcome", personaCheckEOutcome, "return reject_hvut_persona_sync('personaStateWriteRejected', {});");
requirePart("persona.check_e_outcome", personaCheckEOutcome, "return { kind: 'accepted' };");
requirePart("persona.check_e", personaCheckE, "const outcome = persona.check_e_outcome(doc);");
requirePart("persona.check_e", personaCheckE, "return outcome.kind === 'accepted';");
requirePart("persona.change_p_outcome", personaChangePOutcome, "const personaState = persona.check_p_outcome(doc);");
requirePart("persona.change_p_outcome", personaChangePOutcome, "if (personaState.kind === 'rejected') {");
requirePart(
  "persona.change_p_outcome",
  personaChangePOutcome,
  "return reject_hvut_persona_sync('personaPageFetchFailed', { message: String(error?.message || error) });",
);
requirePart("persona.change_p_outcome", personaChangePOutcome, "return personaState;");
requirePart("persona.change_p_outcome", personaChangePOutcome, "const equipOutcome = await persona.change_e_outcome();");
requirePart("persona.change_p_outcome", personaChangePOutcome, "if (equipOutcome.kind === 'rejected') return equipOutcome;");
requirePart("persona.change_p_outcome", personaChangePOutcome, "const difficultyOutcome = ctx.dfct.set_button_outcome(doc);");
requirePart("persona.change_p_outcome", personaChangePOutcome, "if (difficultyOutcome.kind === 'rejected') return difficultyOutcome;");
requirePart("persona.change_p_outcome", personaChangePOutcome, "return { kind: 'accepted' };");
requirePart("persona.change_p", personaChangeP, "const outcome = await persona.change_p_outcome(pset);");
requirePart("persona.change_p", personaChangeP, "return outcome.kind === 'accepted';");
requirePart("persona.change_e_outcome", personaChangeEOutcome, "const equipState = persona.check_e_outcome(doc);");
requirePart("persona.change_e_outcome", personaChangeEOutcome, "if (equipState.kind === 'rejected') {");
requirePart(
  "persona.change_e_outcome",
  personaChangeEOutcome,
  "return reject_hvut_persona_sync('equipPageFetchFailed', { message: String(error?.message || error) });",
);
requirePart("persona.change_e_outcome", personaChangeEOutcome, "if (persona.selector_e) persona.selector_e.disabled = false;");
requirePart("persona.change_e_outcome", personaChangeEOutcome, "return equipState;");
requirePart("persona.change_e_outcome", personaChangeEOutcome, "const loadOutcome = await persona.load_dynjs_outcome(doc);");
requirePart("persona.change_e_outcome", personaChangeEOutcome, "if (loadOutcome.kind === 'rejected') return loadOutcome;");
requirePart("persona.change_e", personaChangeE, "const outcome = await persona.change_e_outcome(eset);");
requirePart("persona.change_e", personaChangeE, "return outcome.kind === 'accepted';");
requirePart("_eq.popup_load", equipPopupLoad, "clear_hvut_equip_popup_drop_info(doc, 'equipPopupDropInfo');");
requirePart("_eq.charm_append", equipCharmAppend, "record_hvut_character_parse_failure('equipPopupCharmText', { charm: charm });");
requirePart("_eq.charm_append", equipCharmAppend, "if (append_hvut_equip_popup_charms(doc, div, 'equipPopupCharmAppend') === false) {");

for (const required of [
  "const stat = parse_hvut_character_base_stat_row(tr, 'equipmentBaseStatSourceRow');",
  "decorate_hvut_equipment_base_stat_row(tr, base, 'equipmentBaseStatTargetRow');",
  "const stat = parse_hvut_character_base_stat_row(tr, 'legacyEquipmentBaseStatSourceRow');",
  "decorate_hvut_equipment_base_stat_row(tr, base, 'legacyEquipmentBaseStatTargetRow');",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} equipment base stat rendering must route through ${required}`);
  }
}

for (const [required, expected] of [
  ["const personaContext = render_hvut_equipment_persona_context($persona, 'equipmentPersonaContextRejected');", 1],
  ["const personaContext = render_hvut_equipment_persona_context($persona, 'legacyEquipmentPersonaContextRejected');", 1],
  ["if (personaContext.kind === 'rejected') return;", 2],
]) {
  const count = (text.match(new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  if (count !== expected) violations.push(`${target} must keep ${expected} equipment persona context render call(s) for ${required}, found ${count}`);
}

for (const forbidden of [
  "const value = /^(.+) Lv\\.(\\d+)/.exec($id('level_readout', doc).textContent.trim())[1];",
  "const eset = parseInt($qs('img[src$=\"_on.png\"]', doc).src.match(/set(\\d+)_on/)[1]);",
  "persona.init = function ()",
  "persona.change_e();",
  "persona.change_p();",
  "const personaCheck = persona.check_p();",
  "if (persona.check_p(doc) === null)",
  "if (persona.check_e(doc) === false)",
  "if ($persona.check_e() === false) return;",
  "persona.check_p(doc);\n    if (persona.selector_p)",
  "persona.check_e(doc);\n    const json = persona.json;",
  "if ((await persona.change_e()) === false) return false;",
  "if (loadOutcome.kind === 'rejected') return false;",
  "if (ctx.dfct.set_button(doc) === false)",
  "return reject_hvut_persona_sync('personaDifficultyRefreshRejected', {});",
  "ctx.dfct.set_button(doc);\n  };",
  "doc.querySelector('.showequip').children[2]",
  "doc.querySelector('.eq').appendChild(div)",
  "const [, type, tier] = reg_charm.exec(charm);",
  "base[tr.children[0].textContent] = tr.children[1].textContent;",
  "const name = tr.cells[1].textContent;\n      const enName = resolveEn(tr.cells[1], 'characterStatus') ?? name;",
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
