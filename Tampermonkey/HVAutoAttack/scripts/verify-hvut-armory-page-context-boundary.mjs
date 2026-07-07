import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_armory_page_context = function (config, query) {",
  "var source = resolve_hvut_page_query(query);",
  "var section = source?.s;",
  "var ss = source?.ss;",
  "var screen = source?.screen;",
  "var filter = source?.filter;",
  "var integrateAll = filter === 'all' && !!config?.settings?.equipmentIntegration;",
  "section: section,",
  "ss: ss,",
  "screen: screen,",
  "filter: filter,",
  "isArmory: section === 'Bazaar' && ss === 'am',",
  "hasEquiplist: !!$id('equiplist'),",
  "isModify: screen === 'modify',",
  "integrateAll: integrateAll,",
  "canOrganize: screen !== 'purchase' && filter !== 'salvaged',",
  "var hvut_armory_page_context = null;",
  "var get_hvut_armory_page_context = function (config) {",
  "hvut_armory_page_context = hvut_armory_page_context || create_hvut_armory_page_context(config);",
  "return hvut_armory_page_context;",
  "const armoryPage = create_hvut_armory_page_context($config);",
  "pageContext: armoryPage,",
  "$armory.page.init(null, $armory.pageContext.screen);",
  "const filter = $armory.pageContext.filter;",
  "create_hvut_armory_screen_url($armory.pageContext.screen, { filter: 'all' })",
  "if ($armory.pageContext.filter === 'all') {",
  "filter = $armory.pageContext.filter",
  "if (armoryPage.canOrganize) {",
  "if (armoryPage.screen === 'organize') {",
  "if (armoryPage.integrateAll) {",
  "if (armoryPage.screen === 'modify') {",
  "if (armoryPage.screen === 'purchase') {",
  "if (armoryPage.screen === 'sell') {",
  "if (armoryPage.screen === 'salvage') {",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep Armory page context boundary: ${required}`);
  }
}

const bindArmoryBody =
  /const bindArmory = function \(armory, ctx\) \{[\s\S]*?\n\};\n\nif \(IS_ISEKAI\)/.exec(text)?.[0] || "";

if (!bindArmoryBody) {
  violations.push(`${target} must keep bindArmory body visible for page context guard`);
}

const externalArmoryBodies = [
  ...text.matchAll(
    /\/\/\* \[(?:10|20)\] Armory - Equiplist[\s\S]*?\/\/ \[END (?:11|21)\] (?:Armory|Bazaar - Armory Modify)/g,
  ),
];

if (externalArmoryBodies.length !== 2) {
  violations.push(`${target} must keep two external Armory ingress bodies visible, found ${externalArmoryBodies.length}`);
}

externalArmoryBodies.forEach((match, index) => {
  const body = match[0];
  for (const required of [
    "get_hvut_armory_page_context($config).isArmory",
    "get_hvut_armory_page_context($config).hasEquiplist",
    "get_hvut_armory_page_context($config).isModify",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} external Armory body[${index}] must consume page context: ${required}`);
    }
  }
  for (const forbidden of [
    "_query.s === 'Bazaar' && _query.ss === 'am'",
    "_query.ss === 'am'",
    "_query.screen === 'modify'",
    "$id('equiplist')",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} external Armory body[${index}] must not rebuild ingress identity: ${forbidden}`);
    }
  }
});

for (const forbidden of [
  "$armory.page.init(null, _query.screen);",
  "let labels = $armory.type_labels[_query.filter];",
  "$armory.filters.includes(_query.filter)",
  "_query.filter === 'all'",
  "create_hvut_armory_screen_url(_query.screen, { filter: 'all' })",
  "filter = _query.filter",
  "_query.screen !== 'purchase' && _query.filter !== 'salvaged'",
  "_query.screen === 'organize'",
  "_query.screen === 'modify'",
  "_query.screen === 'purchase'",
  "_query.screen === 'sell'",
  "_query.screen === 'salvage'",
  "_query.filter === 'all' && $config.settings.equipmentIntegration",
]) {
  if (bindArmoryBody.includes(forbidden)) {
    violations.push(`${target} Armory must consume page context instead of raw query: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-armory-page-context-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-armory-page-context-boundary] OK - Armory screen/filter routing uses one page context");
