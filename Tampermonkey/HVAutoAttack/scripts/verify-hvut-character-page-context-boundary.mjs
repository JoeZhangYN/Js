import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_character_page_context = function (query) {",
  "var source = query || _query;",
  "var ss = source?.ss || 'ch';",
  "var hasPersonaSurface = !!$id('persona_outer');",
  "surfaceSs: ss,",
  "hasPersonaSurface: hasPersonaSurface,",
  "isCharacter: ss === 'ch' || hasPersonaSurface,",
  "isEquipment: ss === 'eq',",
  "isAbilities: ss === 'ab',",
  "isTraining: ss === 'tr',",
  "isItemInventory: ss === 'it',",
  "isSettings: ss === 'se',",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep Character page context boundary: ${required}`);
  }
}

const characterBodies = [
  ...text.matchAll(/const characterPage = create_hvut_character_page_context\(\);[\s\S]*?\n\} else\n\/\/ \[END (?:6|7)\] Character - Settings/g),
].map((match) => match[0]);

if (characterBodies.length !== 2) {
  violations.push(`${target} must keep both Character segment bodies visible, found ${characterBodies.length}`);
}

const fontSettingChecks = [...text.matchAll(/if \(create_hvut_character_page_context\(\)\.isSettings\) \{/g)].length;
if (fontSettingChecks !== 2) {
  violations.push(`${target} must route both font setting checks through Character page context, found ${fontSettingChecks}`);
}

if (!text.includes("$id('csp').dataset.ss = create_hvut_character_page_context().surfaceSs;")) {
  violations.push(`${target} must derive csp surface ss through Character page context`);
}

for (const forbidden of [
  "if (_query.ss === 'se') {",
  "$id('csp').dataset.ss = _query.ss || 'ch';",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep raw Character settings/surface identity: ${forbidden}`);
  }
}

for (const [index, body] of characterBodies.entries()) {
  for (const required of [
    "const characterPage = create_hvut_character_page_context();",
    "if (_query.s === 'Character' && characterPage.isCharacter) {",
    "if (_query.s === 'Character' && characterPage.isEquipment) {",
    "if (_query.s === 'Character' && characterPage.isAbilities) {",
    "if (_query.s === 'Character' && characterPage.isTraining) {",
    "if (_query.s === 'Character' && characterPage.isItemInventory) {",
    "if (_query.s === 'Character' && characterPage.isSettings) {",
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
