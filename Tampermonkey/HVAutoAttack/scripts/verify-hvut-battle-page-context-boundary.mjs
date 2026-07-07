import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_battle_page_context = function (query) {",
  "var parse_hvut_page_query = function (search) {",
  "var get_hvut_location_query = function () {",
  "var resolve_hvut_page_query = function (query) {",
  "var source = resolve_hvut_page_query(query);",
  "var section = source?.s;",
  "var ss = source?.ss;",
  "var hasInitForm = typeof $id === 'function' && !!$id('initform');",
  "section: section,",
  "hasInitForm: hasInitForm,",
  "isBattle: section === 'Battle',",
  "isBattleList: section === 'Battle' && hasInitForm,",
  "isArena: section === 'Battle' && ss === 'ar',",
  "isRing: section === 'Battle' && ss === 'rb',",
  "isTower: section === 'Battle' && ss === 'tw',",
  "isGrindFest: section === 'Battle' && ss === 'gr',",
  "isItemWorld: section === 'Battle' && ss === 'iw',",
  "var hvut_battle_page_context = null;",
  "var get_hvut_battle_page_context = function () {",
  "hvut_battle_page_context = hvut_battle_page_context || create_hvut_battle_page_context();",
  "return hvut_battle_page_context;",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep Battle page context boundary: ${required}`);
  }
}

const battleBodies = [
  ...text.matchAll(/if \(get_hvut_battle_page_context\(\)\.isBattle(?:List)?\) \{[\s\S]*?\n\} else\n\/\/ Battle/g),
].map((match) => match[0]);

if (battleBodies.length !== 2) {
  violations.push(`${target} must keep both Battle segment bodies visible, found ${battleBodies.length}`);
}

for (const [index, body] of battleBodies.entries()) {
  for (const required of [
    "const battlePage = get_hvut_battle_page_context();",
    "if (battlePage.isArena) {",
    "if (battlePage.isRing) {",
    "if (battlePage.isGrindFest) {",
    "if (battlePage.isItemWorld) {",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} Battle body[${index}] must consume page context: ${required}`);
    }
  }
  for (const forbidden of [
    "_query.ss === 'ar'",
    "_query.ss === 'rb'",
    "_query.ss === 'tw'",
    "_query.ss === 'gr'",
    "_query.ss === 'iw'",
    "_query.s === 'Battle'",
    "create_hvut_battle_page_context();",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} Battle body[${index}] must not rebuild subpage identity from raw query: ${forbidden}`);
    }
  }
}

for (const forbidden of [
  "_query.s === 'Battle'",
  "_query.s === 'Battle' && $id('initform')",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not rebuild Battle page identity from raw query: ${forbidden}`);
  }
}

if (!battleBodies[0]?.includes("if (battlePage.isTower) {")) {
  violations.push(`${target} modern Battle body must preserve Tower routing through page context`);
}

if (violations.length) {
  console.error("[verify-hvut-battle-page-context-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-battle-page-context-boundary] OK - Battle subpage routing uses one context");
