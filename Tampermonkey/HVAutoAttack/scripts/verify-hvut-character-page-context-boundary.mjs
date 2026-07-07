import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_character_page_context = function (query) {",
  "var source = resolve_hvut_page_query(query);",
  "var section = source?.s;",
  "var ss = source?.ss || 'ch';",
  "var equipSlot = source?.equip_slot;",
  "var hasPersonaSurface = !!$id('persona_outer');",
  "section: section,",
  "equipSlot: equipSlot,",
  "surfaceSs: ss,",
  "hasPersonaSurface: hasPersonaSurface,",
  "isCharacter: section === 'Character' && (ss === 'ch' || hasPersonaSurface),",
  "isEquipment: section === 'Character' && ss === 'eq',",
  "isAbilities: section === 'Character' && ss === 'ab',",
  "isTraining: section === 'Character' && ss === 'tr',",
  "isItemInventory: section === 'Character' && ss === 'it',",
  "isSettings: section === 'Character' && ss === 'se',",
  "hasEquipSlot: section === 'Character' && ss === 'eq' && !!equipSlot,",
  "var hvut_character_page_context = null;",
  "var get_hvut_character_page_context = function () {",
  "hvut_character_page_context = hvut_character_page_context || create_hvut_character_page_context();",
  "return hvut_character_page_context;",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep Character page context boundary: ${required}`);
  }
}

const characterBodies = [
  ...text.matchAll(/const characterPage = get_hvut_character_page_context\(\);[\s\S]*?\n\} else\n\/\/ \[END (?:6|7)\] Character - Settings/g),
].map((match) => match[0]);

if (characterBodies.length !== 2) {
  violations.push(`${target} must keep both Character segment bodies visible, found ${characterBodies.length}`);
}

const fontSettingChecks = [...text.matchAll(/if \(get_hvut_character_page_context\(\)\.isSettings\) \{/g)].length;
if (fontSettingChecks !== 2) {
  violations.push(`${target} must route both font setting checks through Character page context, found ${fontSettingChecks}`);
}

if (!text.includes("$id('csp').dataset.ss = get_hvut_character_page_context().surfaceSs;")) {
  violations.push(`${target} must derive csp surface ss through Character page context`);
}

for (const forbidden of [
  "if (_query.ss === 'se') {",
  "_query.s === 'Character'",
  "_query.equip_slot",
  "$id('csp').dataset.ss = _query.ss || 'ch';",
  "create_hvut_character_page_context().isSettings",
  "const characterPage = create_hvut_character_page_context();",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep raw Character settings/surface identity: ${forbidden}`);
  }
}

for (const [index, body] of characterBodies.entries()) {
  for (const required of [
    "const characterPage = get_hvut_character_page_context();",
    "if (characterPage.isCharacter) {",
    "if (characterPage.isEquipment) {",
    "if (characterPage.hasEquipSlot) {",
    "if (characterPage.isAbilities) {",
    "if (characterPage.isTraining) {",
    "if (characterPage.isItemInventory) {",
    "if (characterPage.isSettings) {",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Character body[${index}] must consume page context: ${required}`);
    }
  }
  for (const forbidden of [
    "_query.ss === 'ch'",
    "_query.ss === 'eq'",
    "_query.ss === 'ab'",
    "_query.ss === 'tr'",
    "_query.ss === 'it'",
    "_query.ss === 'se'",
    "|| $id('persona_outer')",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} Character body[${index}] must not rebuild subpage identity from raw query: ${forbidden}`);
    }
  }
}

if (violations.length) {
  console.error("[verify-hvut-character-page-context-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-character-page-context-boundary] OK - Character subpage routing uses one context");
